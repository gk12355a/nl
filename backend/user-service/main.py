from fastapi import FastAPI

app = FastAPI(title=""user-service"")

@app.get(""/"")
async def root():
    return {""message"": ""user-service is running!""}
