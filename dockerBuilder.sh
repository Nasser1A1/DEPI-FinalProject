SERVICES="services/*"

for f in $SERVICES
do
  if [ -d "$f" ]; then
    echo "Processing service: $f"
    
    echo "Building Docker image for $f..."
    echo "image name: $(basename $f)"
    #docker build -t "$(basename $f)" "$f"
    
    echo "Pushing image to ECR..."
    # aws ecr get-login-password ...
    # docker tag "$(basename $f)":latest <AWS-ACCOUNT-ID>.dkr.ecr.eu-central-1.amazonaws.com/ecommerce-app:latest 
    # docker push <AWS-ACCOUNT-ID>.dkr.ecr.eu-central-1.amazonaws.com/ecommerce-app:latest
    
    echo "Done for $f"
    echo "---------------------------"
  else
    echo "Skipping $f (not a directory)"
  fi
done