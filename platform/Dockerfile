# VERITRAIL API + website container (MVP). Run behind a TLS-terminating reverse proxy.
FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 VERITRAIL_VAR_DIR=/data
WORKDIR /srv/veritrail
COPY requirements.txt .
RUN pip install --no-cache-dir PyYAML Markdown Jinja2 reportlab
COPY . .
RUN python3 app/website/build.py && useradd -r -u 10001 veritrail && mkdir -p /data && chown veritrail /data
USER veritrail
ENV PYTHONPATH=/srv/veritrail/app/common:/srv/veritrail/app/assessment-engine:/srv/veritrail/app/reports:/srv/veritrail/app/policy-engine:/srv/veritrail/app/runtime-shield:/srv/veritrail/app/agent:/srv/veritrail/app/api:/srv/veritrail/app/admin
EXPOSE 8080
VOLUME ["/data"]
CMD ["python3", "-m", "veritrail_api.server", "--host", "0.0.0.0", "--port", "8080"]
