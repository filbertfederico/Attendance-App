# BackEnd/routers/utils.py

def is_div_head_of_division(user, division: str) -> bool:
    return user.role == "div_head" and user.division.upper() == division.upper()


def is_hrd_head(user) -> bool:
    return user.role == "div_head" and user.division.upper() == "HRD & GA"


def is_finance_head(user) -> bool:
    return user.role == "div_head" and user.division.upper() == "FINANCE"

def is_hrd_staff(user) -> bool:
    return user.role == "staff" and user.division.upper() == "HRD & GA"