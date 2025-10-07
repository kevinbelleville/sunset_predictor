sudo cp deployment/*.service /etc/systemd/system/
sudo cp deployment/*.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now sunset-predictor.timer
