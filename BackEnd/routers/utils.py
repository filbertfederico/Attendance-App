# BackEnd/routers/utils.py

def get_div_head_role(division: str) -> str | None:
    if not division:
        return None

    division = division.upper().strip()

    if division.startswith("DIV_HEAD_"):
        return division

    mapping = {
        "OPS": "DIV_HEAD_OPS",
        "HRD": "DIV_HEAD_HRD",
        "HSE": "DIV_HEAD_HSE",
        "MARKETING": "DIV_HEAD_MARKETING",
        "FINANCE": "DIV_HEAD_FINANCE",
        "GENERAL": "DIV_HEAD_GENERAL",
    }

    return mapping.get(division)
