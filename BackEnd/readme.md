pip: 
pip install -r requirements.txt

python:
python -m pip install -r requirements.txt
or
python3 -m pip install -r requirements.txt
------------------------------------------------------
🚀 6. Run Your API

run from /attendance-app:
uvicorn BackEnd.main:app --reload

url: 
http://127.0.0.1:8000