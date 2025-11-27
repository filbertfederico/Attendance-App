# BackEnd/routers/utils.py
DIV_HEAD_MAP = {
    "OPS": "DIV_HEAD_OPS",
    "HRD": "DIV_HEAD_HRD",
    "HSE": "DIV_HEAD_HSE",
    "MARKETING": "DIV_HEAD_MARKETING",
    "FINANCE": "DIV_HEAD_FINANCE"
}

def get_div_head_role(division: str):
    if not division:
        return None
    return DIV_HEAD_MAP.get(division.upper())
