set -e

echo "[1] Cài đặt MongoDB..."
sudo apt-get update
sudo apt-get install -y gnupg curl

# Thêm GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | \
  sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor

# Thêm repo (Ubuntu 22.04 - jammy)
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] \
https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" \
  | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

sudo apt-get update
sudo apt-get install -y mongodb-org

echo "[2] Cấu hình mongod.conf..."
LOCAL_IP=$(hostname -I | awk '{print $1}')

sudo tee /etc/mongod.conf > /dev/null <<EOF
storage:
  dbPath: /var/lib/mongodb

systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

net:
  port: 27017
  bindIp: 127.0.0.1,$LOCAL_IP
EOF

echo "[3] Khởi động MongoDB..."
sudo systemctl daemon-reexec
sudo systemctl enable --now mongod

echo "✅ MongoDB single node đã chạy tại $LOCAL_IP:27017"