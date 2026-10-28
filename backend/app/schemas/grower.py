from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.validators import bank_account_number, ifsc_code


class GrowerBase(BaseModel):
    name: str
    address: str | None = None
    city: str | None = None
    mobile: str | None = None
    account: str | None = None


class _BankDetails(BaseModel):
    """Bank account number + IFSC. Checked on the way in (create/update) only."""

    account_number: str | None = None
    ifsc_code: str | None = None

    @field_validator("account_number")
    @classmethod
    def _check_account_number(cls, v):
        return bank_account_number(v)

    @field_validator("ifsc_code")
    @classmethod
    def _check_ifsc(cls, v):
        return ifsc_code(v)


class GrowerCreate(GrowerBase, _BankDetails):
    pass


class GrowerUpdate(GrowerBase, _BankDetails):
    pass


class GrowerOut(GrowerBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    code: str
    packhouse_id: int
    account_number: str | None = None
    ifsc_code: str | None = None
