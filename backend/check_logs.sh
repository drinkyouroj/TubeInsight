#!/bin/bash
# Script to check the backend logs for recent activity

echo "Checking backend logs..."
echo "Checking for analyze-video requests in backend logs..."
sudo journalctl -u tubeinsight-backend -n 100 --no-pager | grep -i "analyze" || echo "No 'analyze' entries found in logs"

echo -e "\nChecking for token validation errors..."
sudo journalctl -u tubeinsight-backend -n 100 --no-pager | grep -i "token" || echo "No 'token' related entries found in logs"

echo -e "\n\nChecking Nginx logs for errors..."
sudo tail -n 20 /var/log/nginx/error.log

echo -e "\n\nChecking Flask app logs..."
sudo find /var/log -name "tubeinsight*.log" -type f -exec ls -la {} \;
sudo find /var/log -name "tubeinsight*.log" -type f -exec tail -n 20 {} \;