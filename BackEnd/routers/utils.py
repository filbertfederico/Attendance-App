# BackEnd/routers/utils.py
from fastapi import Depends, HTTPException
from auth import get_current_user

def _role(user):
    return (user.role or "").lower()

def _division(user):
    return (user.division or "").upper()


def is_div_head_of_division(user, division: str) -> bool:
    if not division:
            return False
    return _role(user) == "div_head" and _division(user) == division.upper()

def is_hrd_head(user) -> bool:
    return _role(user) == "div_head" and _division(user) == "HRD & GA"


def is_hrd_staff(user) -> bool:
    return _role(user) == "staff" and _division(user) == "HRD & GA"


def is_finance_head(user) -> bool:
    return _role(user) == "div_head" and _division(user) == "FINANCE"


def require_admin(current_user=Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    if current_user.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    return current_user