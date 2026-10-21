# AEGIS API + website container (MVP). Run behind a TLS-terminating reverse proxy.
FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 AEGIS_VAR_DIR=/data
WORKDIR /srv/aegis
COPY requirements.txt .
RUN pip install --no-cache-dir PyYAML Markdown Jinja2 reportlab
COPY . .
RUN python3 app/website/build.py && useradd -r -u 10001 aegis && mkdir -p /data && chown aegis /data
USER aegis
ENV PYTHONPATH=/srv/aegis/app/common:/srv/aegis/app/assessment-engine:/srv/aegis/app/reports:/srv/aegis/app/policy-engine:/srv/aegis/app/runtime-shield:/srv/aegis/app/agent:/srv/aegis/app/api:/srv/aegis/app/admin
EXPOSE 8080
VOLUME ["/data"]
CMD ["python3", "-m", "aegis_api.server", "--host", "0.0.0.0", "--port", "8080"]
