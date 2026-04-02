FROM python:3.11-slim

# Remove unnecessary files to reduce attack surface
RUN rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* && \
    useradd -m -u 1000 -s /bin/sh sandbox

USER sandbox
WORKDIR /sandbox
