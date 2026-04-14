#!/bin/bash

set -e

# Kiểm tra quyền root
if [ "$EUID" -ne 0 ]; then
  echo "Vui lòng chạy script bằng sudo"
  exit 1
fi

REDIS_IP=$(hostname -I | awk '{print $1}')
REDIS_PORT=6379

echo "[1] Cập nhật hệ thống"
apt-get update -y

echo "[2] Cài đặt Redis"
apt-get install -y redis-server

echo "[3] Backup cấu hình"
cp /etc/redis/redis.conf /etc/redis/redis.conf.bak

echo "[4] Cấu hình Redis"

# Bind IP
sed -i "s/^bind .*/bind 127.0.0.1 $REDIS_IP/" /etc/redis/redis.conf

# Port
sed -i "s/^port .*/port $REDIS_PORT/" /etc/redis/redis.conf

# Tắt protected mode (chỉ nên dùng trong môi trường dev/lab)
sed -i "s/^protected-mode yes/protected-mode no/" /etc/redis/redis.conf

# Không yêu cầu mật khẩu (dev/lab)
sed -i "s/^# requirepass .*/requirepass \"\"/" /etc/redis/redis.conf

# Giảm số database
sed -i "s/^databases 16/databases 1/" /etc/redis/redis.conf

echo "[5] Khởi động lại Redis"
systemctl restart redis-server
systemctl enable redis-server

echo "[6] Kiểm tra trạng thái"
systemctl status redis-server --no-pager

echo "[7] Kiểm tra kết nối"
redis-cli -h $REDIS_IP -p $REDIS_PORT ping

if [ $? -eq 0 ]; then
  echo "Redis hoạt động bình thường (PONG)"
else
  echo "Không kết nối được Redis, kiểm tra log: journalctl -u redis-server"
  exit 1
fi

echo "[8] Mở firewall nếu dùng UFW"
if command -v ufw >/dev/null; then
  ufw allow $REDIS_PORT/tcp || true
fi

echo "Hoàn tất cài đặt Redis tại $REDIS_IP:$REDIS_PORT"