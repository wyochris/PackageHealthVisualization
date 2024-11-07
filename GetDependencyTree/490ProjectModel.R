pkgs <- read.csv("C:\\Users\\gajavegs\\Downloads\\csse490ProjectData_nameless.csv")
str(pkgs)
hist(pkgs$scores)


pkgs_train <- pkgs
pkgs_test <- read.csv("C:\\Users\\gajavegs\\Downloads\\scoring_data_file_fixed_nameless.csv")


if (!requireNamespace("rpart", quietly = TRUE)) {
  install.packages("rpart")
}
library(rpart)

m.rpart <- rpart(scores ~ ., data = pkgs_train)
m.rpart

summary(m.rpart)
# A more detailed summary of the tree's fit, including the mean squared error for each of the nodes and an overall measure of feature importance

library(rpart.plot)
rpart.plot(m.rpart, digits = 3)

rpart.plot(m.rpart, digits = 4, fallen.leaves = TRUE,
           type = 3, extra = 101)

p.rpart <- predict(m.rpart, pkgs_test)
summary(p.rpart)
hist(p.rpart)
summary(pkgs_test$scores)

if (!requireNamespace("utils", quietly = TRUE)) {
  install.packages("utils")
}

# Load the required library
library(utils)

results <- data.frame(p.rpart)
output_file <- "C:\\Users\\gajavegs\\Downloads\\scores_results.csv"
write.csv(results, file = output_file, row.names = FALSE)
