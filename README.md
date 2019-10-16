# Classification-of-gallery-images-by-Active-learning-

The project is based on active learning. The idea is to classify gallery images into three classes.

For training, images are chosen from these three classes namely-
1.Documents
2.Human_images
3.Memes

VGG19_pretrained have been used in order to get good results even while working with less training data.
FC layers are changed to get the required result.

Test images are classified using the model and then stored in another directory "classified/" + "/class", where class is the name of class having max probability.  
