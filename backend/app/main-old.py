from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, day_summary, growers, incoming, orders, packhouses, payments, users
from app.core.config import settings

app = FastAPI(title=settings.APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(packhouses.router)
app.include_router(growers.router)
app.include_router(incoming.router)
app.include_router(day_summary.router)
app.include_router(payments.router)
app.include_router(users.router)
app.include_router(orders.router)


@app.get("/")
def root():
    return {"name": settings.APP_NAME, "status": "ok"}


@app.get("/health")
def health():
    return {"status": "ok"}
