#!/bin/bash

echo "Running database migrations..."
python -m alembic upgrade head
# Path to a flag file in a persistent volume
FLAG_FILE="/app/model/.med_system_trained"

if [ ! -f "$FLAG_FILE" ]; then
    echo "First time setup: Running initial model training..."
    python /app/scripts/train.py
    
    # Only create the flag if training actually succeeded
    if [ $? -eq 0 ]; then
        touch "$FLAG_FILE"
        echo "Training complete. Flag created."
    else
        echo "Training failed. Will retry on next restart."
        exit 1
    fi
else
    echo "Model already trained. Skipping train.py..."
fi

# Execute the CMD (uvicorn)
exec "$@"