import hashlib
import json
import os
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import psycopg2
import psycopg2.extras
import requests


SCHEMA = 't_p97630513_yandex_cleaning_serv'
API_DELAY = 0.6
PREVIEW_CAMPAIGN_LIMIT = 5

IMPORTANT_PLATFORMS = {
    'yandex.ru', 'ya.ru', 'dzen.ru', 'kinopoisk.ru', 'mail.ru', 'vk.com', 'ok.ru',
    'youtube.com', 'rutube.ru', 'google.com', 'avito.ru', 'wildberries.ru',
    'ozon.ru', 'market.yandex.ru', 'drive2.ru', '2gis.ru', 'rbc.ru', 'ria.ru',
    'lenta.ru', 'tass.ru', 'kommersant.ru', 'rzd.ru', 'tutu.ru', 'aviasales.ru',
    'hh.ru', 'habr.com', 'vc.ru', 'pikabu.ru', 'sportmaster.ru', 'dns-shop.ru',
}


def response(status: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
        },
        'body': json.dumps(body, ensure_ascii=False, default=str),
    }


def normalize_list(value, lower: bool = False) -> List[str]:
    if not value:
        return []
    items = value.split(',') if isinstance(value, str) else value
    result = [str(item).strip() for item in items if str(item).strip()]
    return [item.lower() for item in result] if lower else result


def normalize_goal_ids(config: Dict[str, Any]) -> List[str]:
    goal_ids = normalize_list(config.get('goal_ids'))
    if goal_ids:
        return goal_ids[:10]

    goal_id = str(config.get('goal_id') or '').strip()
    if goal_id and goal_id not in ('all', 'selected'):
        return [goal_id]

    return []


def is_important_platform(domain: str) -> bool:
    domain = (domain or '').lower().strip()
    return any(domain == important or domain.endswith('.' + important) for important in IMPORTANT_PLATFORMS)


def platform_conversions_for_config(platform: Dict[str, Any], config: Dict[str, Any]) -> int:
    goal_ids = normalize_goal_ids(config)
    if not goal_ids:
        return int(platform.get('conversions', 0) or 0)

    goal_conversions = platform.get('goal_conversions') or {}
    if goal_conversions:
        return int(sum(goal_conversions.get(str(goal_id), 0) or 0 for goal_id in goal_ids))

    return int(platform.get('conversions', 0) or 0)


def platform_cpa_for_config(platform: Dict[str, Any], config: Dict[str, Any]) -> float:
    conversions = platform_conversions_for_config(platform, config)
    if conversions <= 0:
        return 0
    return float(platform.get('cost', 0) or 0) / conversions


def domain_matches_keyword(domain: str, keyword: str) -> bool:
    if '.' in keyword:
        if keyword.endswith('.') and not keyword.startswith('.'):
            return domain.startswith(keyword)
        if keyword.startswith('.') and not keyword.endswith('.'):
            return domain.endswith(keyword)
        return keyword in domain
    return keyword in domain


def matches_task_filters(platform: Dict[str, Any], config: Dict[str, Any], combine_operator: str = 'AND') -> bool:
    domain = platform['domain'].lower()
    combine_operator = (combine_operator or config.get('combine_operator') or 'AND').upper()

    exceptions = normalize_list(config.get('exceptions', []), lower=True)
    if exceptions and any(exc in domain for exc in exceptions):
        return False

    if config.get('protect_conversions') and platform_conversions_for_config(platform, config) > 0:
        return False

    conditions = []
    keywords = normalize_list(config.get('keywords', []), lower=True)
    if keywords:
        conditions.append(any(domain_matches_keyword(domain, keyword) for keyword in keywords))

    metric_rules = [
        ('min_impressions', lambda value: platform.get('impressions', 0) >= value),
        ('max_impressions', lambda value: platform.get('impressions', 0) <= value),
        ('min_clicks', lambda value: platform.get('clicks', 0) >= value),
        ('max_clicks', lambda value: platform.get('clicks', 0) <= value),
        ('min_cpc', lambda value: platform.get('cpc', 0) >= value),
        ('max_cpc', lambda value: platform.get('cpc', 0) <= value),
        ('min_ctr', lambda value: platform.get('ctr', 0) >= value),
        ('max_ctr', lambda value: platform.get('ctr', 0) <= value),
        ('min_conversions', lambda value: platform_conversions_for_config(platform, config) >= value),
        ('min_cpa', lambda value: platform_cpa_for_config(platform, config) >= value),
        ('max_cpa', lambda value: platform_cpa_for_config(platform, config) <= value),
    ]

    for key, predicate in metric_rules:
        value = config.get(key)
        if value is not None:
            conditions.append(predicate(float(value)))

    if not conditions:
        return False

    if combine_operator == 'OR':
        return any(conditions)
    return all(conditions)


def validate_task_config(config: Dict[str, Any], combine_operator: str) -> List[str]:
    config = config or {}
    combine_operator = (combine_operator or 'OR').upper()
    keywords = normalize_list(config.get('keywords'))
    exceptions = normalize_list(config.get('exceptions'))
    goal_ids = normalize_goal_ids(config)
    has_conversion_guard = bool(goal_ids) or bool(config.get('protect_conversions'))

    metric_keys = [
        'min_impressions', 'max_impressions', 'min_clicks', 'max_clicks',
        'min_cpc', 'max_cpc', 'min_ctr', 'max_ctr',
        'min_conversions', 'min_cpa', 'max_cpa',
    ]
    active_metrics = [key for key in metric_keys if config.get(key) is not None]
    reasons = []

    if not keywords and not active_metrics:
        reasons.append('Нет условий блокировки: добавьте домены, клики, CPA, CTR или конверсии.')

    only_broad_metric = len(active_metrics) == 1 and active_metrics[0] in (
        'min_impressions', 'max_impressions', 'min_clicks', 'max_clicks',
    )
    if only_broad_metric and not keywords and not has_conversion_guard:
        reasons.append('Одна широкая метрика без целей и доменных условий опасна.')

    min_impressions = config.get('min_impressions')
    if min_impressions is not None and int(min_impressions) <= 10 and not keywords and not has_conversion_guard:
        reasons.append('Показы больше 1-10 без дополнительных условий запрещены.')

    if combine_operator == 'OR' and active_metrics and not keywords and not exceptions and not has_conversion_guard:
        reasons.append('Для режима "Любое условие" нужны ограничители: цель, исключения или доменные признаки.')

    return reasons[:3]


def create_report(campaign_id: str, yandex_token: str, client_login: str, date_from: str, date_to: str, goal_ids: Optional[List[str]]) -> Dict[str, Any]:
    normalized_goal_ids = [str(goal_id).strip() for goal_id in (goal_ids or []) if str(goal_id).strip()][:10]
    goal_suffix = ''
    if normalized_goal_ids:
        goal_suffix = '_g' + hashlib.sha1(','.join(normalized_goal_ids).encode('utf-8')).hexdigest()[:8]

    payload = {
        'params': {
            'SelectionCriteria': {
                'Filter': [
                    {'Field': 'CampaignId', 'Operator': 'EQUALS', 'Values': [str(campaign_id)]},
                    {'Field': 'Impressions', 'Operator': 'GREATER_THAN', 'Values': ['0']},
                ],
                'DateFrom': date_from,
                'DateTo': date_to,
            },
            'FieldNames': ['Placement', 'Clicks', 'Cost', 'Conversions', 'Impressions'],
            'ReportName': f'preview_{campaign_id}_{date_from}_{date_to}{goal_suffix}_{int(time.time())}',
            'ReportType': 'CUSTOM_REPORT',
            'DateRangeType': 'CUSTOM_DATE',
            'Format': 'TSV',
            'IncludeVAT': 'NO',
            'IncludeDiscount': 'NO',
        }
    }
    if normalized_goal_ids:
        payload['params']['Goals'] = normalized_goal_ids
        payload['params']['AttributionModels'] = ['AUTO']

    try:
        headers = {
            'Authorization': f'Bearer {yandex_token}',
            'Accept-Language': 'ru',
            'processingMode': 'auto',
            'returnMoneyInMicros': 'false',
            'skipReportHeader': 'true',
            'skipReportSummary': 'true',
        }
        if client_login:
            headers['Client-Login'] = client_login

        resp = requests.post(
            'https://api.direct.yandex.com/json/v5/reports',
            headers=headers,
            json=payload,
            timeout=30,
        )
        time.sleep(API_DELAY)
        if resp.status_code == 200:
            return {'status': 200, 'data': resp.text}
        if resp.status_code in (201, 202):
            return {'status': resp.status_code, 'report_name': payload['params']['ReportName']}
        return {'status': resp.status_code, 'error': resp.text[:1000]}
    except requests.exceptions.Timeout:
        return {'status': 408, 'error': 'Request timeout'}
    except Exception as exc:
        return {'status': 500, 'error': str(exc)}


def parse_tsv_report(tsv_data: str) -> List[Dict[str, Any]]:
    lines = tsv_data.strip().split('\n')
    if len(lines) < 2:
        return []

    header = lines[0].split('\t')
    platforms = []
    for line in lines[1:]:
        parts = line.split('\t')
        if len(parts) < len(header):
            continue
        row = dict(zip(header, parts))
        domain = (row.get('Placement') or parts[0]).strip().lower()
        if not domain or ' ' in domain:
            continue

        goal_conversions = {}
        for key, value in row.items():
            if not key.startswith('Conversions_'):
                continue
            key_parts = key.split('_')
            if len(key_parts) >= 3:
                goal_id = key_parts[1]
                goal_conversions[goal_id] = goal_conversions.get(goal_id, 0) + int(float(value or 0))

        conversions = int(float(row.get('Conversions') or 0))
        if goal_conversions:
            conversions = sum(goal_conversions.values())
        clicks = int(float(row.get('Clicks') or 0))
        cost = float(row.get('Cost') or 0)
        impressions = int(float(row.get('Impressions') or 0))

        platforms.append({
            'domain': domain,
            'clicks': clicks,
            'cost': cost,
            'conversions': conversions,
            'goal_conversions': goal_conversions,
            'impressions': impressions,
            'cpc': cost / clicks if clicks else 0,
            'cpa': cost / conversions if conversions else 0,
            'ctr': clicks / impressions * 100 if impressions else 0,
            'important': is_important_platform(domain),
        })

    return platforms


def get_excluded_sites(token: str, campaign_id: str, client_login: str = '') -> Optional[List[str]]:
    try:
        headers = {'Authorization': f'Bearer {token}', 'Accept-Language': 'ru'}
        if client_login:
            headers['Client-Login'] = client_login

        resp = requests.post(
            'https://api.direct.yandex.com/json/v5/campaigns',
            json={
                'method': 'get',
                'params': {
                    'SelectionCriteria': {'Ids': [int(campaign_id)]},
                    'FieldNames': ['Id', 'ExcludedSites', 'Status'],
                },
            },
            headers=headers,
            timeout=30,
        )
        time.sleep(API_DELAY)
        if resp.status_code != 200:
            return None
        campaigns = resp.json().get('result', {}).get('Campaigns', [])
        if not campaigns or str(campaigns[0].get('Id')) != str(campaign_id):
            return None
        if campaigns[0].get('Status') != 'ACCEPTED':
            return []
        excluded_sites = campaigns[0].get('ExcludedSites') or {}
        return [str(site).lower() for site in (excluded_sites.get('Items') or [])]
    except Exception:
        return None


def platform_view(platform: Dict[str, Any], campaign_id: str, already_blocked: bool = False) -> Dict[str, Any]:
    return {
        'campaign_id': str(campaign_id),
        'domain': platform['domain'],
        'important': bool(platform.get('important')),
        'already_blocked': already_blocked,
        'impressions': int(platform.get('impressions', 0) or 0),
        'clicks': int(platform.get('clicks', 0) or 0),
        'cost': round(float(platform.get('cost', 0) or 0), 2),
        'conversions': int(platform.get('conversions', 0) or 0),
        'cpa': round(float(platform.get('cpa', 0) or 0), 2),
        'ctr': round(float(platform.get('ctr', 0) or 0), 2),
    }


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    if event.get('httpMethod') == 'OPTIONS':
        return response(200, {})

    if event.get('httpMethod', 'POST') != 'POST':
        return response(405, {'error': 'Method not allowed'})

    user_id = (event.get('headers') or {}).get('X-User-Id') or (event.get('headers') or {}).get('x-user-id')
    if not user_id:
        return response(401, {'error': 'X-User-Id header required'})

    try:
        user_id_int = int(user_id)
        body = json.loads(event.get('body') or '{}')
        project_id = int(body.get('project_id') or 0)
    except Exception:
        return response(400, {'error': 'Invalid request body'})

    config = body.get('config') or {}
    combine_operator = body.get('combine_operator') or config.get('combine_operator') or 'OR'
    safety_reasons = validate_task_config(config, combine_operator)
    if safety_reasons:
        return response(400, {
            'error': 'unsafe_task_config',
            'message': 'Правило выглядит опасным. Предпросмотр не будет запускаться.',
            'reasons': safety_reasons,
        })

    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return response(500, {'error': 'DATABASE_URL not configured'})

    try:
        conn = psycopg2.connect(dsn)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(f"""
            SELECT id, name, yandex_token, campaign_ids, client_login
            FROM {SCHEMA}.rsya_projects
            WHERE id = %s AND user_id = %s
        """, (project_id, user_id_int))
        project = cur.fetchone()
        conn.close()
    except Exception as exc:
        return response(500, {'error': str(exc)})

    if not project:
        return response(404, {'error': 'Project not found'})
    if not project.get('yandex_token'):
        return response(400, {'error': 'Project has no Yandex token'})
    client_login = (project.get('client_login') or '').strip()

    campaign_ids = project.get('campaign_ids') or []
    if isinstance(campaign_ids, str):
        campaign_ids = json.loads(campaign_ids) if campaign_ids else []
    campaign_ids = [str(campaign_id) for campaign_id in campaign_ids if str(campaign_id).strip()]
    if not campaign_ids:
        return response(400, {'error': 'No campaigns configured'})

    selected_campaign_ids = campaign_ids[:int(body.get('campaign_limit') or PREVIEW_CAMPAIGN_LIMIT)]
    date_to = datetime.now().strftime('%Y-%m-%d')
    date_from = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
    goal_ids = normalize_goal_ids(config)

    will_block = []
    already_blocked = []
    kept_examples = []
    errors = []
    reports_pending = []
    checked = 0
    matched = 0

    for campaign_id in selected_campaign_ids:
        report = create_report(campaign_id, project['yandex_token'], client_login, date_from, date_to, goal_ids)
        if report['status'] in (201, 202):
            reports_pending.append({'campaign_id': campaign_id, 'report_name': report.get('report_name')})
            continue
        if report['status'] != 200:
            errors.append({'campaign_id': campaign_id, 'status': report['status'], 'error': report.get('error')})
            continue

        excluded = get_excluded_sites(project['yandex_token'], campaign_id, client_login)
        excluded_set = set(excluded or [])

        for platform in parse_tsv_report(report['data']):
            checked += 1
            is_match = matches_task_filters(platform, config, combine_operator)
            if is_match:
                matched += 1
                if platform['domain'] in excluded_set:
                    if len(already_blocked) < 30:
                        already_blocked.append(platform_view(platform, campaign_id, True))
                elif len(will_block) < 50:
                    will_block.append(platform_view(platform, campaign_id, False))
            elif len(kept_examples) < 50:
                kept_examples.append(platform_view(platform, campaign_id, platform['domain'] in excluded_set))

    important_will_block = [item for item in will_block if item['important']]
    warnings = []
    if important_will_block:
        warnings.append('Под блок попадают важные площадки. Проверьте список перед сохранением.')
    if checked and matched / checked > 0.5:
        warnings.append('Правило захватывает больше половины проверенных площадок. Лучше сузить условия.')
    if reports_pending:
        warnings.append('Часть отчетов Direct ушла в асинхронную подготовку, предпросмотр неполный.')

    return response(200, {
        'success': True,
        'project_id': project_id,
        'project_name': project.get('name'),
        'client_login': client_login,
        'period': {'date_from': date_from, 'date_to': date_to},
        'sampled': len(selected_campaign_ids) < len(campaign_ids),
        'campaigns_checked': selected_campaign_ids,
        'campaigns_total': len(campaign_ids),
        'checked': checked,
        'matched': matched,
        'will_block_count_sample': len(will_block),
        'already_blocked_count_sample': len(already_blocked),
        'kept_count_sample': len(kept_examples),
        'will_block_examples': will_block,
        'already_blocked_examples': already_blocked,
        'kept_examples': kept_examples,
        'important_will_block_examples': important_will_block,
        'important_platforms_checked': sorted(IMPORTANT_PLATFORMS),
        'warnings': warnings,
        'reports_pending': reports_pending,
        'errors': errors,
    })
