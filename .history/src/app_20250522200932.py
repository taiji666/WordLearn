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
    # 仅针对 /data/ 路径下的请求进行 ETag 处理
    if request.url.path.startswith("/data/"):
        # 根据当前数据版本生成预期的 ETag 值
        # ETag 值通常需要用双引号包裹
        expected_etag = f'"{DATA_VERSION}"'
        
        # 获取客户端请求中的 If-None-Match 头
        if_none_match = request.headers.get("if-none-match")
        
        # 如果客户端的 ETag 与当前服务器版本匹配
        if if_none_match == expected_etag:
            # 内容未修改，返回 304 Not Modified 响应
            # 这样可以避免执行 call_next(request) 及后续的路由处理，提高效率
            response_304 = Response(status_code=304)
            response_304.headers["ETag"] = expected_etag
            # 建议为 304 响应也设置 Cache-Control，指导客户端如何处理其缓存
            response_304.headers["Cache-Control"] = "public, max-age=3600, must-revalidate"
            # 可选：如果之前使用 Expires，也可以在这里为 304 设置
            # response_304.headers["Expires"] = time.strftime("%a, %d %b %Y %H:%M:%S GMT", time.gmtime(time.time() + 3600))
            return response_304

    # 如果 ETag 不匹配，或者请求路径不是 /data/，则正常处理请求
    response = await call_next(request)

    # 再次检查路径，并确保只对成功的（2xx）响应设置 ETag 和 Cache-Control
    if request.url.path.startswith("/data/") and 200 <= response.status_code < 300:
        # 设置缓存过期时间，例如 1 小时 (3600 秒)
        # 添加 must-revalidate 确保缓存在过期后必须与源服务器验证 ETag
        response.headers["Cache-Control"] = "public, max-age=3600, must-revalidate"
        
        # 为响应添加 ETag 头，值为当前数据版本
        response.headers["ETag"] = f'"{DATA_VERSION}"'

        # Expires 头通常用于旧版 HTTP/1.0 缓存
        # 它是一个具体的日期时间，这里设置为 1 小时后
        # 注意：max-age 优先级更高 (保持用户原有注释)
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