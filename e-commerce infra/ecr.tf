####################################
# ECR Repository
####################################
resource "aws_ecr_repository" "app_repo" {
  name                 = "ecommerce-app"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "ecommerce-app-repo"
  }
}

####################################
# ECR Repository Policy (Optional)
# Allows IAM users in the same account to push/pull
####################################
resource "aws_ecr_repository_policy" "app_repo_policy" {
  repository = aws_ecr_repository.app_repo.name

  policy = jsonencode({
    Version = "2008-10-17",
    Statement = [
      {
        Sid       = "AllowPushPull"
        Effect    = "Allow"
        Principal = {
          AWS = "*"
        }
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:BatchGetImage",
          "ecr:CompleteLayerUpload",
          "ecr:GetDownloadUrlForLayer",
          "ecr:InitiateLayerUpload",
          "ecr:PutImage",
          "ecr:UploadLayerPart"
        ]
      }
    ]
  })
}
