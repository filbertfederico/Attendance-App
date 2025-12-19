# BackEnd/routers/utils.py

def _role(user):
    return (user.role or "").lower()

def _division(user):
    return (user.division or "").upper()


def is_div_head_of_division(user, division: str) -> bool:
    return _role(user) == "div_head" and user.division.upper() == "HRD & GA" if division is None else division.upper()


def is_hrd_head(user) -> bool:
    return _role(user) == "div_head" and _division(user) == "HRD & GA"


def is_hrd_staff(user) -> bool:
    return _role(user) == "staff" and _division(user) == "HRD & GA"


def is_finance_head(user) -> bool:
    return _role(user) == "div_head" and _division(user) == "FINANCE"