resource "aws_ecr_repository" "auth" {
  name = "auth-service"
}

resource "aws_ecr_repository" "product" {
  name = "product-service"
}

resource "aws_ecr_repository" "cart" {
  name = "cart-service"
}

resource "aws_ecr_repository" "payment" {
  name = "payment-service"
}

resource "aws_ecr_repository" "analytics" {
  name = "analytics-service"
}

resource "aws_ecr_repository" "ai_search" {
  name = "ai-search-service"
}
