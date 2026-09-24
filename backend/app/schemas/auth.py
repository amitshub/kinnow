from pydantic import BaseModel


class LoginRequest(BaseModel):
    mobile: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
