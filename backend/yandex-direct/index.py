import json
import os
from datetime import datetime, timedelta
from typing import Dict, Any, List
import requests
import time

def extract_campaign_counter_ids(campaign: Dict[str, Any]) -> List[str]:
    counter_ids: List[str] = []

    def add_values(value: Any) -> None:
        if not value:
            return
        if isinstance(value, dict):
            for key in ('Items', 'CounterIds', 'Ids'):
                add_values(value.get(key))
            return
        if isinstance(value, (list, tuple)):
            for item in value:
                add_values(item)
            return
        normalized = str(value).strip()
        if normalized and normalized not in counter_ids:
            counter_ids.append(normalized)

    def walk(value: Any) -> None:
        if isinstance(value, dict):
            if 'CounterIds' in value:
                add_values(value.get('CounterIds'))
            for nested_value in value.values():
                walk(nested_value)
            return
        if isinstance(value, list):
            for item in value:
                walk(item)

    walk(campaign)

    return counter_ids

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Работа с API Яндекс.Директ - получение кампаний РСЯ и OAuth конфиг
    Args: event - dict с httpMethod, queryStringParameters, body
          context - объект с request_id
    Returns: HTTP response dict с данными кампаний
    '''
    method: str = event.get('httpMethod', 'GET')
    path: str = event.get('path', '')
    query_params = event.get('queryStringParameters', {}) or {}
    
    # CORS OPTIONS
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token, X-Client-Login',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    # GET /config - вернуть OAuth Client ID
    if method == 'GET' and query_params.get('action') == 'config':
        client_id = os.environ.get('YANDEX_DIRECT_CLIENT_ID', '')
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'clientId': client_id})
        }
    
    # GET ?action=accounts - получить доступные рекламные аккаунты для токена
    if method == 'GET' and query_params.get('action') == 'accounts':
        headers_raw = event.get('headers', {})
        token = headers_raw.get('X-Auth-Token') or headers_raw.get('x-auth-token')

        if not token:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Отсутствует токен авторизации'})
            }

        accounts = []
        errors = []
        diagnostics = []

        def add_account(login: str, name: str = '', source: str = 'direct', role: str = ''):
            login = (login or '').strip()
            if not login:
                return
            if any(account['login'].lower() == login.lower() for account in accounts):
                return
            accounts.append({
                'login': login,
                'name': name or login,
                'source': source,
                'role': role
            })

        try:
            info_response = requests.get(
                'https://login.yandex.ru/info?format=json',
                headers={'Authorization': f'OAuth {token}'},
                timeout=10
            )
            if info_response.status_code == 200:
                info = info_response.json()
                add_account(info.get('login'), info.get('real_name') or info.get('display_name') or '', 'owner', 'OAuth user')
            else:
                errors.append(f'login_info:{info_response.status_code}')
        except Exception as e:
            errors.append(f'login_info:{str(e)}')

        direct_headers = {
            'Authorization': f'Bearer {token}',
            'Accept-Language': 'ru'
        }

        try:
            clients_response = requests.post(
                'https://api.direct.yandex.com/json/v501/clients',
                headers=direct_headers,
                json={
                    'method': 'get',
                    'params': {
                        'FieldNames': ['Login', 'ClientInfo', 'Type', 'Representatives', 'AvailableCampaignTypes']
                    }
                },
                timeout=20
            )
            clients_data = clients_response.json()
            if 'error' in clients_data:
                errors.append(f"clients:{clients_data['error'].get('error_code')}:{clients_data['error'].get('error_string')}")
            else:
                clients = clients_data.get('result', {}).get('Clients', []) or []
                diagnostics.append(f'direct_clients:{len(clients)}')
                for client in clients:
                    add_account(
                        client.get('Login'),
                        client.get('ClientInfo') or client.get('Login') or '',
                        'direct',
                        client.get('Type') or 'client'
                    )
        except Exception as e:
            errors.append(f'clients:{str(e)}')

        try:
            agency_response = requests.post(
                'https://api.direct.yandex.com/json/v5/agencyclients',
                headers=direct_headers,
                json={
                    'method': 'get',
                    'params': {
                        'SelectionCriteria': {'Archived': 'NO'},
                        'FieldNames': ['Login', 'ClientInfo', 'Archived', 'Type']
                    }
                },
                timeout=20
            )
            agency_data = agency_response.json()
            if 'error' in agency_data:
                # Не агентский токен обычно вернет ошибку. Это не блокер: оставляем ручной Client-Login.
                agency_error = f"agencyclients:{agency_data['error'].get('error_code')}:{agency_data['error'].get('error_string')}"
                errors.append(agency_error)
                diagnostics.append('agency_access:no')
            else:
                agency_clients = agency_data.get('result', {}).get('Clients', []) or []
                diagnostics.append(f'agency_clients:{len(agency_clients)}')
                for client in agency_clients:
                    add_account(
                        client.get('Login'),
                        client.get('ClientInfo') or client.get('Login') or '',
                        'agency',
                        client.get('Type') or 'client'
                    )
        except Exception as e:
            errors.append(f'agencyclients:{str(e)}')

        current_client_login = (
            headers_raw.get('X-Client-Login')
            or headers_raw.get('x-client-login')
            or query_params.get('client_login')
            or ''
        ).strip()
        if current_client_login:
            add_account(current_client_login, current_client_login, 'manual', 'selected')

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'accounts': accounts, 'errors': errors, 'diagnostics': diagnostics}, ensure_ascii=False)
        }

    # GET ?action=check_access - быстрая проверка, что токен + Client-Login видят кампании
    if method == 'GET' and query_params.get('action') == 'check_access':
        headers_raw = event.get('headers', {})
        token = headers_raw.get('X-Auth-Token') or headers_raw.get('x-auth-token')
        client_login = (
            headers_raw.get('X-Client-Login')
            or headers_raw.get('x-client-login')
            or query_params.get('client_login')
            or ''
        ).strip()

        if not token:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'success': False, 'error': 'Отсутствует токен авторизации'}, ensure_ascii=False)
            }

        request_headers = {
            'Authorization': f'Bearer {token}',
            'Accept-Language': 'ru'
        }
        if client_login:
            request_headers['Client-Login'] = client_login

        try:
            is_sandbox = query_params.get('sandbox') == 'true'
            api_url = (
                'https://api-sandbox.direct.yandex.com/json/v501/campaigns'
                if is_sandbox else
                'https://api.direct.yandex.com/json/v501/campaigns'
            )
            response = requests.post(
                api_url,
                headers=request_headers,
                json={
                    'method': 'get',
                    'params': {
                        'SelectionCriteria': {},
                        'FieldNames': ['Id', 'Name', 'Type', 'Status', 'State']
                    }
                },
                timeout=20
            )

            try:
                data = response.json()
            except Exception:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'success': False,
                        'error': f'Директ вернул не JSON: HTTP {response.status_code}',
                        'error_detail': response.text[:500]
                    }, ensure_ascii=False)
                }

            if response.status_code != 200:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'success': False,
                        'error': f'Директ вернул HTTP {response.status_code}',
                        'error_detail': data
                    }, ensure_ascii=False)
                }

            if 'error' in data:
                error_info = data['error']
                error_code = error_info.get('error_code')
                hint = ''
                if error_code == 8800 and client_login.lower().startswith(('porg-', 'e-')):
                    hint = (
                        'Direct API не принял этот логин как Client-Login. '
                        'Для eLama/организационного аккаунта нужен OAuth-токен, выданный именно аккаунту с доступом к Директу, '
                        'или API-доступ к этому аккаунту должен быть открыт на стороне eLama/Яндекса.'
                    )
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'success': False,
                        'error': error_info.get('error_string') or 'Ошибка API Яндекс.Директ',
                        'error_detail': error_info.get('error_detail') or '',
                        'error_code': error_code,
                        'hint': hint,
                        'client_login': client_login
                    }, ensure_ascii=False)
                }

            campaigns = data.get('result', {}).get('Campaigns', []) or []
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({
                    'success': len(campaigns) > 0,
                    'campaigns_count': len(campaigns),
                    'campaigns_sample': campaigns[:5],
                    'client_login': client_login,
                    'error': '' if campaigns else 'Кампании не найдены для этой связки OAuth-токена и Client-Login'
                }, ensure_ascii=False)
            }
        except Exception as e:
            print(f'[ERROR] Failed to check Direct access: {str(e)}')
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'success': False, 'error': str(e), 'client_login': client_login}, ensure_ascii=False)
            }

    # GET ?action=counters - получить все счётчики Метрики
    if method == 'GET' and query_params.get('action') == 'counters':
        headers_raw = event.get('headers', {})
        token = headers_raw.get('X-Auth-Token') or headers_raw.get('x-auth-token')
        
        if not token:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Отсутствует токен авторизации'})
            }
        
        try:
            all_counters = []
            offset = 1
            per_page = 100
            metrika_headers = {'Authorization': f'OAuth {token}'}
            
            print('[DEBUG] Loading all Metrika counters...')
            
            while True:
                counters_url = f'https://api-metrika.yandex.net/management/v1/counters?per_page={per_page}&offset={offset}'
                counters_response = requests.get(counters_url, headers=metrika_headers, timeout=10)
                
                if counters_response.status_code != 200:
                    print(f'[ERROR] Failed to load counters: {counters_response.status_code}')
                    break
                
                counters_data = counters_response.json()
                page_counters = counters_data.get('counters', [])
                
                for counter in page_counters:
                    counter_id = str(counter['id'])
                    counter_name = counter.get('name')
                    
                    # Если имя не получено (редактор, не владелец), запросим отдельно
                    if not counter_name:
                        try:
                            counter_detail_url = f'https://api-metrika.yandex.net/management/v1/counter/{counter_id}'
                            counter_detail_response = requests.get(counter_detail_url, headers=metrika_headers, timeout=10)
                            if counter_detail_response.status_code == 200:
                                counter_detail = counter_detail_response.json()
                                counter_info = counter_detail.get('counter', {})
                                counter_name = counter_info.get('name', f"Счётчик {counter_id}")
                                print(f'[DEBUG] Got name for counter {counter_id}: {counter_name}')
                            else:
                                counter_name = f"Счётчик {counter_id}"
                        except:
                            counter_name = f"Счётчик {counter_id}"
                    
                    all_counters.append({
                        'id': counter_id,
                        'name': counter_name,
                        'site': counter.get('site', ''),
                        'owner_login': counter.get('owner_login', '')
                    })
                
                print(f'[DEBUG] Loaded {len(page_counters)} counters (total: {len(all_counters)})')
                
                if len(page_counters) < per_page:
                    break
                offset += per_page
            
            print(f'[DEBUG] Total counters found: {len(all_counters)}')
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'counters': all_counters})
            }
            
        except Exception as e:
            print(f'[ERROR] Failed to load counters: {str(e)}')
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'error': str(e)})
            }
    
    # GET ?action=goals - получить цели из выбранных счётчиков Метрики
    if method == 'GET' and query_params.get('action') == 'goals':
        headers_raw = event.get('headers', {})
        token = headers_raw.get('X-Auth-Token') or headers_raw.get('x-auth-token')
        
        if not token:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Отсутствует токен авторизации'})
            }
        
        try:
            # Получаем список ID счётчиков из query параметров
            counter_ids_param = query_params.get('counter_ids', '')
            selected_counter_ids = [cid.strip() for cid in counter_ids_param.split(',') if cid.strip()] if counter_ids_param else []
            
            if not selected_counter_ids:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Не указаны ID счётчиков', 'goals': []})
                }
            
            print(f'[DEBUG] Loading ALL goals from selected counters: {selected_counter_ids}')
            
            metrika_headers = {'Authorization': f'OAuth {token}'}
            all_goals = []
            
            # Для каждого выбранного счётчика загружаем ВСЕ цели напрямую из Метрики
            for counter_id in selected_counter_ids:
                try:
                    # Сначала получаем информацию о счётчике
                    counter_url = f'https://api-metrika.yandex.net/management/v1/counter/{counter_id}'
                    counter_response = requests.get(counter_url, headers=metrika_headers, timeout=10)
                    
                    counter_name = f'Счётчик {counter_id}'
                    if counter_response.status_code == 200:
                        counter_data = counter_response.json()
                        counter_info = counter_data.get('counter', {})
                        counter_name = counter_info.get('name', counter_name)
                        print(f'[DEBUG] Counter {counter_id}: {counter_name}')
                    else:
                        print(f'[WARN] Cannot get counter {counter_id} info: {counter_response.status_code}')
                    
                    # Загружаем все цели из счётчика
                    goals_url = f'https://api-metrika.yandex.net/management/v1/counter/{counter_id}/goals'
                    goals_response = requests.get(goals_url, headers=metrika_headers, timeout=10)
                    
                    if goals_response.status_code == 200:
                        goals_data = goals_response.json()
                        counter_goals = goals_data.get('goals', [])
                        
                        print(f'[DEBUG] Counter {counter_id} ({counter_name}): {len(counter_goals)} goals')
                        
                        for goal in counter_goals:
                            goal_id = str(goal.get('id', ''))
                            if goal_id:
                                all_goals.append({
                                    'id': goal_id,
                                    'name': goal.get('name', f'Цель {goal_id}'),
                                    'counter_id': str(counter_id),
                                    'counter_name': counter_name,
                                    'type': goal.get('type', 'unknown'),
                                    'campaigns': []  # Пустой массив для совместимости
                                })
                    else:
                        print(f'[ERROR] Cannot load goals from counter {counter_id}: {goals_response.status_code}')
                        
                except Exception as counter_error:
                    print(f'[ERROR] Failed to load goals from counter {counter_id}: {counter_error}')
                    continue
            
            print(f'[DEBUG] Total goals loaded from {len(selected_counter_ids)} counters: {len(all_goals)}')
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'goals': all_goals})
            }
        
        except Exception as e:
            print(f'[ERROR] Failed to load goals: {str(e)}')
            import traceback
            print(f'[ERROR] Traceback: {traceback.format_exc()}')
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'error': str(e)})
            }
    
    # GET /campaigns — кампании аккаунта (campaigns.get + Reports CAMPAIGN_PERFORMANCE_REPORT), без отсечения по РСЯ
    if method == 'GET':
        headers = event.get('headers', {})
        token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
        client_login = (
            headers.get('X-Client-Login')
            or headers.get('x-client-login')
            or query_params.get('client_login')
            or ''
        ).strip()
        
        if not token:
            return {
                'statusCode': 401,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Отсутствует токен авторизации'})
            }
        
        try:
            print(f'[DEBUG] Requesting Yandex.Direct API with token: {token[:10]}...')
            
            # Проверяем режим sandbox. v501 — для UNIFIED_CAMPAIGN (ЕПК); на json/v5 ЕПК может отдаваться неполно.
            is_sandbox = query_params.get('sandbox') == 'true'
            api_url = (
                'https://api-sandbox.direct.yandex.com/json/v501/campaigns'
                if is_sandbox else
                'https://api.direct.yandex.com/json/v501/campaigns'
            )
            
            print(f'[DEBUG] Using API URL: {api_url} (sandbox={is_sandbox})')
            
            request_headers = {
                'Accept-Language': 'ru'
            }
            
            # И для песочницы, и для продакшна используем Bearer OAuth токен
            request_headers['Authorization'] = f'Bearer {token}'
            if client_login:
                request_headers['Client-Login'] = client_login
                print(f'[DEBUG] Using Client-Login: {client_login}')
            
            response = requests.post(
                api_url,
                headers=request_headers,
                json={
                    'method': 'get',
                    'params': {
                        'SelectionCriteria': {},
                        'FieldNames': ['Id', 'Name', 'Type', 'Status', 'State'],
                        'TextCampaignFieldNames': ['BiddingStrategy', 'CounterIds'],
                        'DynamicTextCampaignFieldNames': ['BiddingStrategy'],
                        'SmartCampaignFieldNames': ['BiddingStrategy'],
                        'UnifiedCampaignFieldNames': ['BiddingStrategy', 'CounterIds'],
                        'MobileAppCampaignFieldNames': ['BiddingStrategy'],
                        'CpmBannerCampaignFieldNames': ['BiddingStrategy', 'CounterIds']
                    }
                },
                timeout=10
            )
            
            print(f'[DEBUG] API Response status: {response.status_code}')
            print(f'[DEBUG] API Response body: {response.text[:500]}')
            
            data = response.json()
            
            # Проверка на ошибку API (Яндекс возвращает 200 даже при ошибках)
            if 'error' in data:
                error_info = data['error']
                error_msg = error_info.get('error_string', 'Неизвестная ошибка')
                error_detail = error_info.get('error_detail', '')
                error_code = error_info.get('error_code', 0)
                
                print(f'[ERROR] Yandex.Direct API error: {error_msg} (код {error_code})')
                print(f'[ERROR] Details: {error_detail}')
                
                # Специальная обработка ошибки 513 (не подключен к Директу)
                if error_code == 513 and is_sandbox:
                    error_msg = 'Аккаунт не активирован в песочнице Директа'
                    error_detail = 'Перейдите на sandbox.direct.yandex.ru, авторизуйтесь и создайте тестовую кампанию для активации песочницы'
                elif error_code == 513:
                    error_detail = 'Зайдите в Яндекс.Директ (direct.yandex.ru) и завершите регистрацию'
                
                # Ошибка 58 - незавершенная регистрация приложения
                if error_code == 58:
                    error_msg = 'Приложение не активировано'
                    if not error_detail:
                        error_detail = 'Необходимо активировать приложение в интерфейсе Яндекс.OAuth и подать заявку на доступ к Директу'
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'campaigns': [],
                        'error': error_msg,
                        'error_detail': error_detail,
                        'error_code': error_code
                    })
                }
            
            campaigns_raw = data.get('result', {}).get('Campaigns', [])
            
            print(f'[DEBUG] Found {len(campaigns_raw)} campaigns total (campaigns.get)')

            reports_url = 'https://api-sandbox.direct.yandex.com/json/v5/reports' if is_sandbox else 'https://api.direct.yandex.com/json/v5/reports'
            report_headers_base = dict(request_headers)
            report_headers_base['Accept-Language'] = 'ru'
            report_headers_base['processingMode'] = 'auto'
            report_headers_base['returnMoneyInMicros'] = 'false'
            report_headers_base['skipReportHeader'] = 'true'
            report_headers_base['skipReportSummary'] = 'true'
            rid = getattr(context, 'request_id', None) or 'local'
            rid_key = str(rid).replace('-', '')[:24]

            # Список кампаний берём через Reports API (CAMPAIGN_PERFORMANCE_REPORT).
            report_campaign_meta: Dict[int, Dict[str, str]] = {}
            try:
                today = datetime.utcnow().date()
                # Широкий период, чтобы не терять кампании из-за узкого окна
                date_from = '2015-01-01'
                date_to = today.strftime('%Y-%m-%d')
                perf_body = {
                    'params': {
                        'SelectionCriteria': {
                            'DateFrom': date_from,
                            'DateTo': date_to,
                        },
                        'FieldNames': ['CampaignId', 'CampaignName', 'CampaignType', 'Impressions'],
                        'ReportName': f'AllCampaigns_{rid_key}_{int(time.time())}',
                        'ReportType': 'CAMPAIGN_PERFORMANCE_REPORT',
                        'DateRangeType': 'CUSTOM_DATE',
                        'Format': 'TSV',
                        'IncludeVAT': 'NO',
                        'IncludeDiscount': 'NO',
                    }
                }
                pr = requests.post(reports_url, headers=report_headers_base, json=perf_body, timeout=120)
                print(f'[DEBUG] CAMPAIGN_PERFORMANCE_REPORT status: {pr.status_code}')
                if pr.status_code == 200 and pr.text and '\t' in pr.text:
                    lines = pr.text.strip().split('\n')
                    hdr = lines[0].split('\t') if lines else []
                    for line in lines[1:]:
                        vals = line.split('\t')
                        if len(vals) < len(hdr):
                            continue
                        row = dict(zip(hdr, vals))
                        try:
                            cid = int(row.get('CampaignId') or 0)
                        except (TypeError, ValueError):
                            continue
                        if not cid:
                            continue
                        report_campaign_meta[cid] = {
                            'name': (row.get('CampaignName') or '').strip(),
                            'type': (row.get('CampaignType') or '').strip(),
                        }
                    print(f'[DEBUG] Report CAMPAIGN_PERFORMANCE_REPORT: {len(report_campaign_meta)} campaign ids')
                else:
                    print(f'[DEBUG] CAMPAIGN_PERFORMANCE_REPORT skipped or empty: {pr.status_code} {pr.text[:200]}')
            except Exception as ex:
                print(f'[DEBUG] CAMPAIGN_PERFORMANCE_REPORT failed: {ex}')

            campaigns_get_by_id = {c.get('Id'): c for c in campaigns_raw if c.get('Id') is not None}
            source_campaigns: List[dict] = []
            seen_ids: set = set()

            # 1) Метаданные из Reports API используем только для кампаний,
            # которые уже подтвердил campaigns.get с тем же Client-Login.
            # Это защищает от подмешивания кампаний владельца OAuth-токена,
            # если Reports вернул данные не того кабинета.
            for cid, meta in report_campaign_meta.items():
                if campaigns_get_by_id and cid not in campaigns_get_by_id:
                    print(f'[DEBUG] Skip report-only campaign {cid}: not present in campaigns.get for client_login={client_login!r}')
                    continue
                c = dict(campaigns_get_by_id.get(cid) or {})
                c['Id'] = cid
                c['Name'] = c.get('Name') or meta.get('name') or 'Без названия'
                c['Type'] = c.get('Type') or meta.get('type') or 'UNKNOWN'
                c['Status'] = c.get('Status') or 'UNKNOWN'
                source_campaigns.append(c)
                seen_ids.add(cid)

            # 2) Плюс все кампании из campaigns.get, которых нет в report
            for c in campaigns_raw:
                cid = c.get('Id')
                if cid is None or cid in seen_ids:
                    continue
                source_campaigns.append(c)
                seen_ids.add(cid)

            print(f'[DEBUG] Source campaigns total (report + get): {len(source_campaigns)}')

            def _bidding_strategy_for(campaign: dict) -> dict:
                ct = campaign.get('Type')
                if ct == 'TEXT_CAMPAIGN':
                    return (campaign.get('TextCampaign') or {}).get('BiddingStrategy') or {}
                if ct == 'DYNAMIC_TEXT_CAMPAIGN':
                    return (campaign.get('DynamicTextCampaign') or {}).get('BiddingStrategy') or {}
                if ct == 'SMART_CAMPAIGN':
                    return (campaign.get('SmartCampaign') or {}).get('BiddingStrategy') or {}
                if ct == 'UNIFIED_CAMPAIGN':
                    return (campaign.get('UnifiedCampaign') or {}).get('BiddingStrategy') or {}
                if ct == 'CPM_BANNER_CAMPAIGN':
                    return (campaign.get('CpmBannerCampaign') or {}).get('BiddingStrategy') or {}
                if ct == 'MOBILE_APP_CAMPAIGN':
                    return (campaign.get('MobileAppCampaign') or {}).get('BiddingStrategy') or {}
                return {}

            def _network_enabled(c: dict) -> bool:
                bs = _bidding_strategy_for(c)
                nt = (bs.get('Network') or {}).get('BiddingStrategyType', '')
                return nt != '' and nt != 'SERVING_OFF'

            # Бейджи channel (ТК / РСЯ / МК) не являются полями API.
            # В objects/campaign перечислены Type (TEXT_CAMPAIGN, DYNAMIC_TEXT_CAMPAIGN, …), но нет значения
            # «Товарная кампания» или «Мастер кампаний» — это названия из интерфейса Директа.
            # В текущей бизнес-логике проекта: ТК помечаем как UNIFIED_CAMPAIGN.
            # МК — эвристика для TEXT_CAMPAIGN, РСЯ — прочие кампании с сетевым трафиком.
            def _channel_label(c: dict) -> str:
                ct = c.get('Type')
                # ТК всегда помечаем по типу кампании, даже если нет BiddingStrategy в ответе.
                if ct == 'UNIFIED_CAMPAIGN':
                    return 'ТК'

                bs = _bidding_strategy_for(c)
                if not bs:
                    return ''

                st = (bs.get('Search') or {}).get('BiddingStrategyType', '')
                nt = (bs.get('Network') or {}).get('BiddingStrategyType', '')
                network_on = nt != 'SERVING_OFF' and nt != ''

                if not network_on:
                    return ''

                if ct == 'DYNAMIC_TEXT_CAMPAIGN':
                    return 'РСЯ'

                if ct == 'SMART_CAMPAIGN':
                    return 'РСЯ'

                if ct == 'TEXT_CAMPAIGN':
                    if st == 'SERVING_OFF':
                        return 'РСЯ'
                    if st != '':
                        return 'МК'
                    return 'РСЯ'

                if ct == 'CPM_BANNER_CAMPAIGN':
                    return 'РСЯ'

                if ct == 'MOBILE_APP_CAMPAIGN':
                    return 'РСЯ'

                return ''

            selected_entries = []
            seen_ids = set()
            for c in source_campaigns:
                cid = c.get('Id')
                if cid in seen_ids:
                    continue
                seen_ids.add(cid)
                label = _channel_label(c) or ''
                network_enabled = _network_enabled(c)
                selected_entries.append({'campaign': c, 'channel': label, 'network_enabled': network_enabled})
                print(f'[DEBUG] Include campaign {cid} "{c.get("Name")}" channel={label!r} network_enabled={network_enabled} Type={c.get("Type")}')

            print(f'[DEBUG] Selected {len(selected_entries)} campaigns (full list)')
            
            # Собираем ID для отчёта по площадкам (CUSTOM_REPORT) — все кампании из списка
            all_platforms_by_campaign = {}
            all_goals_by_campaign = {}

            include_platforms = query_params.get('include_platforms') == 'true'
            text_campaigns = []
            for entry in selected_entries:
                c = entry['campaign']
                campaign_type = c.get('Type')
                text_campaigns.append({
                    'id': str(c.get('Id')),
                    'name': c.get('Name', 'Без названия'),
                    'status': c.get('Status', 'UNKNOWN'),
                    'type': campaign_type
                })

            if include_platforms and text_campaigns:
                campaign_ids = []
                for tc in text_campaigns:
                    raw_id = tc.get('id')
                    try:
                        campaign_ids.append(int(raw_id))
                    except (TypeError, ValueError):
                        continue
                chunk_size = 250
                date_from_pl = (datetime.utcnow().date() - timedelta(days=365)).strftime('%Y-%m-%d')
                date_to_pl = datetime.utcnow().date().strftime('%Y-%m-%d')

                for chunk_start in range(0, len(campaign_ids), chunk_size):
                    chunk_ids = campaign_ids[chunk_start:chunk_start + chunk_size]
                    try:
                        report_body = {
                            'params': {
                                'SelectionCriteria': {
                                    'Filter': [
                                        {'Field': 'CampaignId', 'Operator': 'IN', 'Values': chunk_ids}
                                    ],
                                    'DateFrom': date_from_pl,
                                    'DateTo': date_to_pl,
                                },
                                'FieldNames': [
                                    'CampaignId',
                                    'Placement',
                                    'Impressions',
                                    'Clicks',
                                    'Cost',
                                    'Conversions'
                                ],
                                'ReportName': f'Plat_{rid_key}_{chunk_start}_{int(time.time())}',
                                'ReportType': 'CUSTOM_REPORT',
                                'DateRangeType': 'CUSTOM_DATE',
                                'Format': 'TSV',
                                'IncludeVAT': 'NO',
                                'IncludeDiscount': 'NO'
                            }
                        }

                        report_response = requests.post(
                            reports_url,
                            headers=report_headers_base,
                            json=report_body,
                            timeout=120
                        )

                        print(f'[DEBUG] CUSTOM_REPORT Placement chunk {chunk_start}-{chunk_start + len(chunk_ids)} status: {report_response.status_code}')

                        if report_response.status_code == 200:
                            report_text = report_response.text
                            lines = report_text.strip().split('\n')
                            if len(lines) > 1:
                                headers_line = lines[0].split('\t')
                                for line in lines[1:]:
                                    values = line.split('\t')
                                    if len(values) < len(headers_line):
                                        continue
                                    row = dict(zip(headers_line, values))
                                    campaign_id_str = row.get('CampaignId', '')
                                    platform_name = row.get('Placement', '--')
                                    if not campaign_id_str or platform_name == '--':
                                        continue
                                    if campaign_id_str not in all_platforms_by_campaign:
                                        all_platforms_by_campaign[campaign_id_str] = {}
                                        all_goals_by_campaign[campaign_id_str] = {}
                                    impressions = int(row.get('Impressions', 0) or 0)
                                    clicks = int(row.get('Clicks', 0) or 0)
                                    cost = float(row.get('Cost', 0) or 0)
                                    conversions = int(row.get('Conversions', 0) or 0)
                                    goal_id = row.get('GoalId', '')
                                    if platform_name not in all_platforms_by_campaign[campaign_id_str]:
                                        all_platforms_by_campaign[campaign_id_str][platform_name] = {
                                            'impressions': 0,
                                            'clicks': 0,
                                            'cost': 0,
                                            'conversions': 0,
                                            'goals': {}
                                        }
                                    all_platforms_by_campaign[campaign_id_str][platform_name]['impressions'] += impressions
                                    all_platforms_by_campaign[campaign_id_str][platform_name]['clicks'] += clicks
                                    all_platforms_by_campaign[campaign_id_str][platform_name]['cost'] += cost
                                    all_platforms_by_campaign[campaign_id_str][platform_name]['conversions'] += conversions
                                    if goal_id and goal_id != '--':
                                        if goal_id not in all_goals_by_campaign[campaign_id_str]:
                                            all_goals_by_campaign[campaign_id_str][goal_id] = {'name': f'Цель {goal_id}', 'id': goal_id}
                                        if goal_id not in all_platforms_by_campaign[campaign_id_str][platform_name]['goals']:
                                            all_platforms_by_campaign[campaign_id_str][platform_name]['goals'][goal_id] = {'conversions': 0}
                                        all_platforms_by_campaign[campaign_id_str][platform_name]['goals'][goal_id]['conversions'] += conversions
                        else:
                            print(f'[DEBUG] Placement report chunk failed: {report_response.text[:300]}')
                    except Exception as e:
                        print(f'[DEBUG] Failed to fetch placement chunk: {str(e)}')

                print(f'[DEBUG] Parsed platforms for {len(all_platforms_by_campaign)} campaigns from Reports API')
            else:
                print('[DEBUG] Platform report disabled (include_platforms!=true)')
            
            # Формируем список кампаний с их площадками и целями
            campaigns = []
            for entry in selected_entries:
                c = entry['campaign']
                channel = entry['channel']
                network_enabled = bool(entry.get('network_enabled'))
                campaign_type = c.get('Type')
                campaign_id = str(c.get('Id'))
                counter_ids = extract_campaign_counter_ids(c)

                platforms = []
                goals = []
                
                # Получаем данные из сгруппированных результатов
                if campaign_id in all_platforms_by_campaign:
                    platforms_data = all_platforms_by_campaign[campaign_id]
                    goals_data = all_goals_by_campaign.get(campaign_id, {})
                    
                    # Формируем список целей для кампании
                    goals = [{'id': gid, 'name': gdata['name'], 'type': 'GOAL'} for gid, gdata in goals_data.items()]
                    
                    # Формируем список площадок для кампании
                    for platform_name, pdata in platforms_data.items():
                        clicks = pdata['clicks']
                        impressions = pdata['impressions']
                        cost = pdata['cost']
                        conversions = pdata['conversions']
                        
                        # Расчёт метрик
                        ctr = round((clicks / impressions) * 100, 2) if impressions > 0 else 0
                        cpc = round(cost / clicks, 2) if clicks > 0 else 0
                        conversion_rate = round((conversions / clicks) * 100, 2) if clicks > 0 else 0
                        
                        # Статистика по целям
                        goals_stats = {}
                        for goal_id, goal_data in pdata['goals'].items():
                            goal_conv = goal_data['conversions']
                            goals_stats[goal_id] = {
                                'conversions': goal_conv,
                                'conversion_rate': round((goal_conv / clicks) * 100, 2) if clicks > 0 else 0,
                                'cost_per_goal': round(cost / goal_conv, 2) if goal_conv > 0 else 0
                            }
                        
                        platforms.append({
                            'adgroup_id': platform_name,
                            'adgroup_name': platform_name,
                            'status': 'ACCEPTED',
                            'network_enabled': True,
                            'stats': {
                                'impressions': impressions,
                                'clicks': clicks,
                                'ctr': ctr,
                                'cost': cost,
                                'cpc': cpc,
                                'conversions': conversions,
                                'conversion_rate': conversion_rate,
                                'avg_position': 0,
                                'goals': goals_stats
                            }
                        })
                    
                    print(f'[DEBUG] Campaign {campaign_id}: {len(platforms)} platforms, {len(goals)} goals')
                
                # Если площадок нет и это sandbox, добавляем тестовые данные
                if len(platforms) == 0 and is_sandbox:
                    import random
                    
                    # Если цели не получены, создаем тестовые
                    if not goals:
                        goals = [
                            {'id': '1', 'name': 'Заявка', 'type': 'GOAL'},
                            {'id': '2', 'name': 'Покупка', 'type': 'GOAL'},
                            {'id': '3', 'name': 'Регистрация', 'type': 'GOAL'},
                            {'id': '4', 'name': 'Добавление в корзину', 'type': 'GOAL'},
                            {'id': '5', 'name': 'Звонок', 'type': 'GOAL'},
                            {'id': '6', 'name': 'Подписка', 'type': 'GOAL'}
                        ]
                    
                    test_domains = [
                        # Нормальные площадки
                        'mail.ru', 'dzen.ru', 'yandex.ru', 'vk.com', 'ok.ru',
                        'rambler.ru', 'lenta.ru', 'ria.ru', 'gazeta.ru', 'kommersant.ru',
                        'rbc.ru', 'vedomosti.ru', 'forbes.ru', 'tass.ru', 'interfax.ru',
                        'sports.ru', 'championat.com', 'kp.ru', 'mk.ru', 'aif.ru',
                        'vc.ru', 'habr.com', 'pikabu.ru', 'drive2.ru', 'avito.ru',
                        'auto.ru', 'cian.ru', 'domofond.ru', 'youla.ru', 'wildberries.ru',
                        'ozon.ru', 'lamoda.ru', 'citilink.ru', 'mvideo.ru', 'eldorado.ru',
                        'dns-shop.ru', 'aliexpress.ru', 'sberbank.ru', 'tinkoff.ru', 'vtb.ru',
                        'alfabank.ru', 'gosuslugi.ru', 'mos.ru', 'spb.ru', 'travel.ru',
                        'aviasales.ru', 'booking.com', 'tripadvisor.ru', 'hotels.ru', 'tutu.ru',
                        # Странные/мусорные площадки
                        'dsp.ewer.ru', 'puzzles.yandex.ru', 'vps.com', 'cdn-tracker.net',
                        'ad-server.xyz', 'promo.click', 'banner-exchange.io', 'rtb-network.org',
                        'adtech.solutions', 'media-buy.pro', 'traffic-source.biz', 'click-farm.co',
                        'bot-traffic.ru', 'fake-impressions.net', 'spam-ads.com', 'junk-traffic.org',
                        '123-ads.ru', 'xxx-promo.net', 'casino-traffic.biz', 'adult-banner.xxx',
                        'redirect-chain.io', 'cloaking-site.ru', 'doorway-page.com', 'parked-domain.net',
                        'expired-ssl.org', 'malware-host.ru', 'phishing-page.net', 'scam-ads.biz'
                    ]
                    
                    for i in range(100):
                        domain = random.choice(test_domains) if i >= len(test_domains) else test_domains[i % len(test_domains)]
                        
                        # Генерируем случайную статистику
                        impressions = random.randint(1000, 50000)
                        clicks = random.randint(10, int(impressions * 0.05))
                        ctr = round((clicks / impressions) * 100, 2) if impressions > 0 else 0
                        cost = random.randint(500, 50000)
                        cpc = round(cost / clicks, 2) if clicks > 0 else 0
                        conversions = random.randint(0, int(clicks * 0.15))
                        conversion_rate = round((conversions / clicks) * 100, 2) if clicks > 0 else 0
                        
                        # Генерируем статистику по целям
                        goals_stats = {}
                        for goal in goals:
                            goal_conversions = random.randint(0, conversions)
                            goals_stats[goal['id']] = {
                                'conversions': goal_conversions,
                                'conversion_rate': round((goal_conversions / clicks) * 100, 2) if clicks > 0 else 0,
                                'cost_per_goal': round(cost / goal_conversions, 2) if goal_conversions > 0 else 0
                            }
                        
                        platforms.append({
                            'adgroup_id': f'{campaign_id}_{i+1}',
                            'adgroup_name': domain,
                            'status': random.choice(['ACTIVE', 'PAUSED', 'SUSPENDED']),
                            'network_enabled': True,
                            'stats': {
                                'impressions': impressions,
                                'clicks': clicks,
                                'ctr': ctr,
                                'cost': cost,
                                'cpc': cpc,
                                'conversions': conversions,
                                'conversion_rate': conversion_rate,
                                'avg_position': round(random.uniform(1, 10), 1),
                                'goals': goals_stats
                            }
                        })
                
                campaigns.append({
                    'id': campaign_id,
                    'name': c.get('Name'),
                    'type': campaign_type,
                    'status': c.get('Status'),
                    'state': c.get('State'),
                    'channel': channel,
                    'network_enabled': network_enabled,
                    'counter_ids': counter_ids,
                    'platforms': platforms,
                    'goals': goals
                })
            
            print(f'[DEBUG] Built {len(campaigns)} campaigns for UI')
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'campaigns': campaigns, 'client_login': client_login})
            }
            
        except Exception as e:
            print(f'[ERROR] Exception: {str(e)}')
            # Fail-open: если упали отчеты/парсинг, все равно возвращаем кампании из campaigns.get
            fallback_campaigns = []
            try:
                campaigns_raw_fallback = locals().get('campaigns_raw', []) or []
                for c in campaigns_raw_fallback:
                    cid = c.get('Id')
                    if cid is None:
                        continue
                    fallback_campaigns.append({
                        'id': str(cid),
                        'name': c.get('Name', 'Без названия'),
                        'type': c.get('Type', 'UNKNOWN'),
                        'status': c.get('Status', 'UNKNOWN'),
                        'channel': '',
                        'counter_ids': extract_campaign_counter_ids(c),
                        'platforms': [],
                        'goals': []
                    })
            except Exception as fallback_error:
                print(f'[ERROR] Fallback build failed: {fallback_error}')
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'campaigns': fallback_campaigns,
                    'error': f'Ошибка: {str(e)}',
                    'message': 'Не удалось подключиться к API Яндекс.Директ',
                    'client_login': locals().get('client_login', '')
                })
            }
    
    # POST /exchange_code - обмен кода на токен
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action')
        
        if action == 'exchange_code':
            code = body_data.get('code')
            if not code:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Код авторизации не указан'})
                }
            
            client_id = os.environ.get('YANDEX_DIRECT_CLIENT_ID', '')
            client_secret = os.environ.get('YANDEX_DIRECT_CLIENT_SECRET', '')
            
            try:
                token_response = requests.post(
                    'https://oauth.yandex.ru/token',
                    data={
                        'grant_type': 'authorization_code',
                        'code': code,
                        'client_id': client_id,
                        'client_secret': client_secret
                    }
                )
                
                if token_response.status_code != 200:
                    print(f'[ERROR] Token exchange failed: {token_response.text}')
                    return {
                        'statusCode': 400,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'Ошибка обмена кода на токен', 'details': token_response.text})
                    }
                
                token_data = token_response.json()
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps(token_data)
                }
            except Exception as e:
                print(f'[ERROR] Token exchange exception: {str(e)}')
                return {
                    'statusCode': 500,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': f'Ошибка: {str(e)}'})
                }
        
        # POST /create_test_campaign - создать тестовую кампанию в песочнице
        if action == 'create_test_campaign':
            token = body_data.get('token')
            client_login = body_data.get('client_login')
            
            if not token:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Токен не указан'})
                }
            
            try:
                api_url = 'https://api-sandbox.direct.yandex.com/json/v5/campaigns'
                
                request_headers = {
                    'Authorization': f'Bearer {token}',
                    'Accept-Language': 'ru'
                }
                
                if client_login:
                    request_headers['Client-Login'] = client_login
                
                # Создаём тестовую РСЯ кампанию
                tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
                
                import random
                
                campaign_data = {
                    'method': 'add',
                    'params': {
                        'Campaigns': [{
                            'Name': f'РСЯ тест {datetime.now().strftime("%d.%m %H:%M")}',
                            'StartDate': tomorrow,
                            'TextCampaign': {
                                'BiddingStrategy': {
                                    'Search': {
                                        'BiddingStrategyType': 'SERVING_OFF'
                                    },
                                    'Network': {
                                        'BiddingStrategyType': 'WB_MAXIMUM_CLICKS',
                                        'WbMaximumClicks': {
                                            'BidCeiling': 100000000,
                                            'WeeklySpendLimit': 5000000000
                                        }
                                    }
                                }
                            }
                        }]
                    }
                }
                
                print(f'[DEBUG] Creating campaign with data: {campaign_data}')
                
                response = requests.post(
                    api_url,
                    headers=request_headers,
                    json=campaign_data,
                    timeout=10
                )
                
                print(f'[DEBUG] Create campaign response status: {response.status_code}')
                print(f'[DEBUG] Create campaign response: {response.text}')
                
                data = response.json()
                
                if 'error' in data:
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'success': False,
                            'error': data['error'].get('error_string', 'Неизвестная ошибка'),
                            'error_detail': data['error'].get('error_detail', '')
                        })
                    }
                
                # Проверяем результат создания
                add_results = data.get('result', {}).get('AddResults', [])
                if not add_results or 'Errors' in add_results[0]:
                    errors = add_results[0].get('Errors', []) if add_results else []
                    error_msg = errors[0].get('Message', 'Неизвестная ошибка') if errors else 'Не удалось создать кампанию'
                    error_detail = errors[0].get('Details', '') if errors else ''
                    
                    print(f'[ERROR] Campaign creation failed: {error_msg}')
                    
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({
                            'success': False,
                            'error': error_msg,
                            'error_detail': error_detail
                        })
                    }
                
                campaign_id = add_results[0].get('Id')
                
                import time
                time.sleep(1)
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': True,
                        'campaign_id': campaign_id
                    })
                }
            except Exception as e:
                print(f'[ERROR] Create campaign exception: {str(e)}')
                return {
                    'statusCode': 500,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': f'Ошибка: {str(e)}'})
                }
        
        # POST /clean - запустить чистку площадок
        headers = event.get('headers', {})
        token = headers.get('X-Auth-Token') or headers.get('x-auth-token')
        
        if not token:
            return {
                'statusCode': 401,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Отсутствует токен авторизации'})
            }
        
        campaign_ids = body_data.get('campaignIds', [])
        filters = body_data.get('filters', [])
        
        if not campaign_ids:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Не указаны ID кампаний'})
            }
        
        if not filters:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Не указаны фильтры'})
            }
        
        # TODO: Реальная логика чистки через API Яндекс.Директ
        # 1. Получить площадки кампаний
        # 2. Отфильтровать по паттернам
        # 3. Отключить через API
        
        # Mock результат
        result = {
            'disabled': 247,
            'total': 1520,
            'campaignsProcessed': len(campaign_ids)
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(result)
        }
    
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Метод не поддерживается'})
    }
