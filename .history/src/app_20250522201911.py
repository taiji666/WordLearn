from fastapi import  FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi import Request,Query
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi import APIRouter
from starlette.responses import Response as StarletteResponse
from starlette.datastructures import Headers # 用于构建304响应的头部
i

app = FastAPI()

# 挂载静态文件目录
app.mount("/static", StaticFiles(directory="static"), name="static")
# 挂载静态文件目录
app.mount("/data", StaticFiles(directory="../data"), name="data")
# 设置模板目录
templates = Jinja2Templates("templates")


# @app.middleware("http")
# async def add_cache_control_header(request: Request, call_next):
#     response = await call_next(request)
#     if request.url.path.startswith("/data/"):
#         # 设置缓存过期时间，例如 1 小时 (3600 秒)>
#         response.headers["Cache-Control"] = "public, max-age=3600"
#     return response


# 假设 app 实例已经定义
@app.middleware("http")
async def add_etag_and_cache_control_header(request: Request, call_next):
    # 首先，调用后续的请求处理链路获取原始响应
    response = await call_next(request)

    # 仅对以 /data/ 开头的路径进行处理
    if not request.url.path.startswith("/data/"):
        return response

    # 通常仅对成功的响应 (2xx) 应用 ETag 和缓存逻辑
    if not (200 <= response.status_code < 300):
        return response

    # 定义 Cache-Control 策略，这将应用于 200 OK 和 304 Not Modified 响应
    cache_control_value = "public, max-age=3600"
    
    # 尝试获取或生成 ETag
    current_response_etag = response.headers.get("etag") # ETag 应该是带引号的字符串

    if not current_response_etag:
        # 如果响应头中没有 ETag (例如，不是 FileResponse)，并且响应有 .body 属性 (如 JSONResponse, HTMLResponse)
        # 我们可以基于响应体内容生成一个 ETag
        if hasattr(response, "body") and isinstance(response.body, bytes):
            body_content = response.body
            # 使用 MD5 生成 ETag 值；也可以使用 SHA1 或其他哈希算法
            # 注意：对于非常大的响应体，在中间件中同步计算哈希可能会引入延迟
            generated_etag_value = hashlib.md5(body_content).hexdigest()
            current_response_etag = f'"{generated_etag_value}"' # HTTP ETag 值需要用双引号包裹
            response.headers["ETag"] = current_response_etag
        # 对于 StreamingResponse 或其他没有 .body 属性的响应类型，此处不会生成 ETag

    # 如果我们成功获取或生成了 ETag
    if current_response_etag:
        # 检查请求中的 If-None-Match 头部
        if_none_match_header = request.headers.get("if-none-match")
        if if_none_match_header:
            # If-None-Match 可能包含一个或多个 ETag，用逗号分隔
            # 简单的检查方法是查看当前 ETag 是否在客户端提供的列表中
            # 注意：更健壮的解析会处理弱ETag (W/"...") 和更复杂的列表格式
            client_etags = [etag.strip() for etag in if_none_match_header.split(',')]
            if current_response_etag in client_etags:
                # ETag 匹配，客户端缓存的资源仍然是最新的
                # 返回 304 Not Modified 响应
                headers_for_304 = Headers()
                headers_for_304["Cache-Control"] = cache_control_value
                headers_for_304["ETag"] = current_response_etag
                
                # 根据 RFC 7232 Section 4.1，304响应应包含某些在200 OK响应中也会发送的头部
                for header_name in ("Date", "Expires", "Vary", "Content-Location"):
                    if header_name.lower() in response.headers: # Headers 字典键是大小写不敏感的
                         headers_for_304[header_name] = response.headers[header_name]
                
                return StarletteResponse(status_code=304, headers=headers_for_304)

    # 如果不是304响应 (即，是200 OK 或其他 2xx)，确保设置 Cache-Control
    # ETag 如果是新生成的，此时也已在 response.headers 中
    response.headers["Cache-Control"] = cache_control_value
    return response

@app.get("/")
async def home(request: Request,topicId: str | None = Query(None)):
    return templates.TemplateResponse(
        "index.html",
        {"request": request,"topicId": topicId}
    )
@app.get("/discrimination_page.html")
async def discrimination(request: Request, topicId: str | None = Query(None)): # 重点：添加 topicId 参数
    return templates.TemplateResponse(
        "discrimination_page.html",
        {"request": request, "topicId": topicId} # 重点：将 topicId 传递给模板
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)