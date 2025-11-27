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

run deploy env:
uvicorn BackEnd.main:app --host 0.0.0.0 --port 10000

