from fastapi import  FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi import Request,Query
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi import APIRouter


app = FastAPI()

# 挂载静态文件目录
app.mount("/static", StaticFiles(directory="static"), name="static")
# 挂载静态文件目录
app.mount("/data", StaticFiles(directory="../data"), name="data")
# 设置模板目录
templates = Jinja2Templates("templates")

@app.middleware("http")
async def add_cache_control_header(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/data/"):
        # 设置缓存过期时间，例如 1 小时 (3600 秒)>
        response.headers["Cache-Control"] = "public, max-age=3600"

        # Expires 头通常用于旧版 HTTP/1.0 缓存
        # 它是一个具体的日期时间，这里设置为 1 小时后
        # 注意：max-age 优先级更高
        # response.headers["Expires"] = time.strftime("%a, %d %b %Y %H:%M:%S GMT", time.gmtime(time.time() + 3600))
    return response
@app.get("/")
async def home(request: Request,topicId: str | None = Query(None)):
    return templates.TemplateResponse(
        "index.html",
        {"request": request,"topicId": topicId}
    )
@app.get("/discrimination")
async def discrimination(request: Request, topicId: str | None = Query(None)): # 重点：添加 topicId 参数
    return templates.TemplateResponse(
        "discrimination_page.html",
        {"request": request, "topicId": topicId} # 重点：将 topicId 传递给模板
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)