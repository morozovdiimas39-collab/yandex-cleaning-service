import json
import os
from typing import Any, Dict

import requests


SYSTEM_PROMPT = """
Ты senior performance-маркетолог для Яндекс Директа.
На входе описание бизнеса. Верни только полезную структуру для сбора семантики:
translation, collectionBranches, seedQueries, masks, minusWords, clusters, questions.
Не придумывай частотность. Частотность позже собирается через Wordstat API.
Запросы должны быть на русском, без дублей, коммерчески полезные, пригодные для Wordstat.
Если пользователь описывает бизнес формулировкой вроде "продажа квартир", не зацикливайся
на слове "продажа": переводи описание бизнеса в спрос клиента, например "купить квартиру",
и строй ветки сбора по реальным способам поиска.
"""


SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "translation": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "businessDescription": {"type": "string"},
                "industry": {"type": "string", "enum": ["real_estate", "service"]},
                "businessRole": {"type": "string"},
                "customerSearchIntent": {"type": "string"},
                "coreProduct": {"type": "string"},
                "targetActions": {
                    "type": "array",
                    "items": {"type": "string"},
                },
                "mustNotOverfitTo": {
                    "type": "array",
                    "items": {"type": "string"},
                },
            },
            "required": [
                "businessDescription",
                "industry",
                "businessRole",
                "customerSearchIntent",
                "coreProduct",
                "targetActions",
                "mustNotOverfitTo",
            ],
        },
        "collectionBranches": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "name": {"type": "string"},
                    "priority": {"type": "string", "enum": ["high", "medium", "low"]},
                    "seedMasks": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                },
                "required": ["name", "priority", "seedMasks"],
            },
            "description": "Ветки сбора, которыми AI будет управлять Wordstat",
        },
        "seedQueries": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Стартовые запросы для Wordstat",
        },
        "masks": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Маски и расширяющие паттерны запросов",
        },
        "minusWords": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Минус-темы без минуса в начале",
        },
        "clusters": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "name": {"type": "string"},
                    "intent": {"type": "string"},
                    "examples": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                },
                "required": ["name", "intent", "examples"],
            },
        },
        "questions": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Уточняющие вопросы пользователю",
        },
    },
    "required": [
        "translation",
        "collectionBranches",
        "seedQueries",
        "masks",
        "minusWords",
        "clusters",
        "questions",
    ],
}


def unique(items):
    seen = set()
    result = []
    for item in items:
        value = " ".join(str(item or "").lower().split())
        if value and value not in seen:
            seen.add(value)
            result.append(value)
    return result


def build_fallback_plan(body: Dict[str, Any], reason: str = "openai_unavailable") -> Dict[str, Any]:
    theme = " ".join(str(body.get("theme") or body.get("services") or "").split())
    region = " ".join(str(body.get("region") or "").split())
    exclusions = str(body.get("exclusions") or "")
    audience = str(body.get("audience") or "")
    theme_lc = theme.lower()

    is_real_estate = any(word in theme_lc for word in ["квартир", "новостро", "дом", "недвиж"])
    if is_real_estate:
        core = "квартира" if "кварт" in theme_lc else theme_lc
        demand = "купить квартиру" if "кварт" in theme_lc else f"купить {core}"
        seed_base = [
            demand,
            f"{demand} {region}",
            "квартиры в новостройках",
            f"квартиры в новостройках {region}",
            "купить квартиру от застройщика",
            f"купить квартиру от застройщика {region}",
            "стоимость квартиры",
            f"стоимость квартиры {region}",
            "квартира под ключ",
            f"квартира под ключ {region}",
        ]
        masks = [
            "купить * квартиру",
            "квартира * цена",
            "квартира * стоимость",
            "новостройка * купить",
            "застройщик * квартира",
            "ипотека * квартира",
        ]
        clusters = [
            {"name": "Покупка квартиры", "intent": "commercial", "examples": [demand, f"{demand} {region}"]},
            {"name": "Новостройки", "intent": "commercial", "examples": ["квартиры в новостройках", f"новостройки {region}"]},
            {"name": "Цена и стоимость", "intent": "commercial_research", "examples": ["стоимость квартиры", "цены на квартиры"]},
            {"name": "Застройщик", "intent": "commercial", "examples": ["купить квартиру от застройщика", "квартиры от застройщика"]},
        ]
        minus_words = ["бесплатно", "работа", "вакансии", "своими руками", "скачать", "реферат", "аренда"]
    else:
        core = theme_lc or "услуга"
        demand = core
        seed_base = [
            core,
            f"{core} {region}",
            f"заказать {core}",
            f"заказать {core} {region}",
            f"цена {core}",
            f"стоимость {core}",
            f"{core} отзывы",
            f"{core} рядом",
        ]
        masks = [
            f"заказать {core}",
            f"{core} цена",
            f"{core} стоимость",
            f"{core} отзывы",
            f"{core} {region}",
        ]
        clusters = [
            {"name": "Заказ услуги", "intent": "commercial", "examples": [f"заказать {core}", f"{core} {region}"]},
            {"name": "Цена", "intent": "commercial_research", "examples": [f"цена {core}", f"стоимость {core}"]},
            {"name": "Отзывы", "intent": "research", "examples": [f"{core} отзывы"]},
        ]
        minus_words = ["бесплатно", "работа", "вакансии", "своими руками", "скачать", "обучение"]

    user_exclusions = [part.strip(" -,\n\t") for part in exclusions.replace("\n", ",").split(",")]

    seed_queries = unique(seed_base)
    return {
        "translation": {
            "businessDescription": theme,
            "industry": "real_estate" if is_real_estate else "service",
            "businessRole": "business",
            "customerSearchIntent": demand,
            "coreProduct": core,
            "targetActions": ["купить", "заказать", "узнать цену"],
            "mustNotOverfitTo": [theme] if theme and theme.lower() != demand else [],
        },
        "collectionBranches": [
            {"name": "Коммерческий спрос", "priority": "high", "seedMasks": seed_queries[:4]},
            {"name": "Цена и сравнение", "priority": "medium", "seedMasks": masks[:3]},
            {"name": "Гео-спрос", "priority": "medium", "seedMasks": [q for q in seed_queries if region.lower() in q][:4]},
        ],
        "seedQueries": seed_queries,
        "masks": unique(masks),
        "minusWords": unique(minus_words + user_exclusions),
        "clusters": clusters,
        "questions": [
            "Какие товары или услуги точно не нужно собирать?",
            "Какие города или районы являются приоритетными?",
            "Нужно ли разделять новые и вторичные предложения?",
        ],
        "source": "fallback",
        "fallbackReason": reason,
        "audience": audience,
    }


def response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, X-Session-Token",
        },
        "body": json.dumps(body, ensure_ascii=False),
        "isBase64Encoded": False,
    }


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get("httpMethod", "GET")

    if method == "OPTIONS":
        return response(200, {})

    if method != "POST":
        return response(405, {"error": "Method not allowed"})

    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return response(400, {"error": "Invalid JSON"})

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return response(200, build_fallback_plan(body, "openai_key_not_configured"))

    payload_text = json.dumps(
        {
            "theme": body.get("theme", ""),
            "services": body.get("services", ""),
            "region": body.get("region", ""),
            "exclusions": body.get("exclusions", ""),
            "audience": body.get("audience", ""),
        },
        ensure_ascii=False,
    )

    model = os.environ.get("OPENAI_MODEL", "gpt-4.1-mini")
    proxy_url = os.environ.get("OPENAI_PROXY_URL") or os.environ.get("PROXY_URL")
    proxies = {"http": proxy_url, "https": proxy_url} if proxy_url else None

    try:
        openai_response = requests.post(
            "https://api.openai.com/v1/responses",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "input": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": payload_text},
                ],
                "text": {
                    "format": {
                        "type": "json_schema",
                        "name": "keyword_plan",
                        "strict": True,
                        "schema": SCHEMA,
                    }
                },
            },
            proxies=proxies,
            timeout=60,
        )

        if openai_response.status_code >= 400:
            if openai_response.status_code in (401, 403, 407, 429, 500, 502, 503):
                return response(200, build_fallback_plan(body, f"openai_http_{openai_response.status_code}"))
            return response(
                502,
                {
                    "error": "OpenAI request failed",
                    "status_code": openai_response.status_code,
                    "detail": openai_response.text[:1000],
                },
            )

        data = openai_response.json()
        output_text = data.get("output_text")

        if not output_text:
            for item in data.get("output", []):
                for content in item.get("content", []):
                    if content.get("type") == "output_text":
                        output_text = content.get("text")
                        break
                if output_text:
                    break

        if not output_text:
            return response(502, {"error": "OpenAI response has no output_text"})

        plan = json.loads(output_text)
        plan["source"] = "openai"
        return response(200, plan)

    except Exception as exc:
        return response(200, build_fallback_plan(body, f"openai_exception:{str(exc)[:120]}"))
