from __future__ import print_function
from shutil import copyfile
import argparse
import torch
import os
import numpy as np
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
import torchvision
from torchvision import datasets, transforms
import time
from tensorboardX import SummaryWriter
from datetime import datetime
import pickle
import matplotlib.pyplot as plt  
from sklearn.metrics import f1_score, classification_report, confusion_matrix
writer = SummaryWriter()

os.environ['CUDA_VISIBLE_DEVICES'] = '0'

class ImageFolderWithPaths(datasets.ImageFolder):
    def __getitem__(self, index):
        # this is what ImageFolder normally returns
        original_tuple = super(ImageFolderWithPaths, self).__getitem__(index)
        # the image file path
        path = self.imgs[index][0]
        # make a new tuple that includes original and the path
        tuple_with_path = (original_tuple + (path,))
        return tuple_with_path

transform = transforms.Compose([transforms.Resize((224,224)),transforms.CenterCrop(224),transforms.ToTensor(),])
# data_train = torchvision.datasets.ImageFolder("train", transform=transform)
data_test = ImageFolderWithPaths("./test", transform=transform) # our custom dataset
addr = "./classified/"
# print (train_data).type

vgg_based = torchvision.models.vgg19(pretrained=True)
for param in vgg_based.parameters():
   param.requires_grad = False

# Modify the last layer
# number_features = vgg_based.classifier[6].in_features
features = list(vgg_based.classifier.children())[:-1] # Remove last layer
# print(type(vgg_based.classifier.children()))

features.extend([torch.nn.Linear(4096, 3)])
vgg_based.classifier = torch.nn.Sequential(*features)

lab = {'0':'Documents/', '1':'Human_image/','2':'Memes/'}
def test(args, model, device, test_loader):
    model.eval()
    test_loss = 0
    correct = 0
    with torch.no_grad():
        for data, target, paths in test_loader:
            data, target = data.to(device), target.to(device)
            output = model(data)
            output = F.log_softmax(output, dim=1)
            test_loss += F.nll_loss(output, target, reduction='sum').item() # sum up batch loss
            pred = output.max(1, keepdim=True)[1] # get the index of the max log-probability
            # correct += pred.eq(target.view_as(pred)).sum().item()
            # print(paths[5])
            for i in range(len(pred)):
                # if(pr)
                res_addr = addr + lab[str(pred[i].item())]+paths[i].split('/')[-1]
                # print(pred[i].item())
                copyfile(paths[i], res_addr)
    test_total_len = len(test_loader.dataset)

    return

def main():
    start = time.time()

    parser = argparse.ArgumentParser(description='UC-Mercer satellite dataset')
    
    parser.add_argument('--batch-size', type=int, default=64, metavar='N',
                        help='input batch size for training (default: 64)')
    
    parser.add_argument('--test-batch-size', type=int, default=10, metavar='N',
                        help='input batch size for testing (default: 1000)')
    
    parser.add_argument('--epochs', type=int, default=10, metavar='N',
                        help='number of epochs to train (default: 10)')
    

    parser.add_argument('--lr', type=float, default=0.0003   , metavar='LR',
                        help='learning rate (default: 0.01)')
   
    parser.add_argument('--momentum', type=float, default=0.0, metavar='M',
                        help='SGD momentum (default: 0.9)')
   
    parser.add_argument('--no-cuda', action='store_true', default=False,
                        help='disables CUDA training')
   
    parser.add_argument('--seed', type=int, default=1, metavar='S',
                        help='random seed (default: 1)')
   
    parser.add_argument('--log-interval', type=int, default=20, metavar='N',
                        help='how many batches to wait before logging training status')
    
    parser.add_argument('--save-model', action='store_true', default=False,
                        help='For Saving the current Model')
    
    args = parser.parse_args()

    use_cuda = not args.no_cuda and torch.cuda.is_available()
    device = torch.device("cuda" if use_cuda else "cpu")
    kwargs = {'num_workers': 1, 'pin_memory': True} if use_cuda else {}
    # train_loader = torch.utils.data.DataLoader(data_train, batch_size=32 ,shuffle = True, **kwargs)
    test_loader = torch.utils.data.DataLoader(data_test, batch_size=32 ,shuffle = False, **kwargs)
    print("device: ",device)
    model = vgg_based.to(device)   # optimizer = optim.SGD(model.parameters(), lr=args.lr, momentum=args.momentum)   
    optimizer = optim.Adam(model.parameters(), lr=args.lr, betas=(0.9, 0.999), eps=1e-08, weight_decay=0, amsgrad=False)
    # optimizer = optim.RMSprop(model.parameters(), lr=args.lr, alpha=0.99, eps=1e-08, weight_decay=0, momentum=args.momentum, centered=False)

    print("#######__parameters__######")
    print("learning rate: ", args.lr, "\nmomentum: ", args.momentum, "\nepochs: ", args.epochs)
    print("############################")    
    print(type(model.state_dict()))
    print("model:\n",model)
    print("############################")
    print("optimizer:\n",optimizer)
    print("############################")
    # exit()
    model = torch.load("file:pretrained: train_acc:97.6470588235294 epochs: 8 active_learning.pt")
    test(args, model, device, test_loader)
    pwd=os.getcwd()
    use_cuda = not False and torch.cuda.is_available()
    device = torch.device("cuda" if use_cuda else "cpu") 
    data_test = ImageFolderWithPaths(pwd+"/test")
    data_classified = ImageFolderWithPaths(pwd+"/classified")
    count=0
    for data1,target1,paths1 in data_classified:
        # print(paths1)
        for data2,target2,paths2 in data_test:
            # print(data1)
            if(data1==data2):
                # print('----------------------11')
                if paths2 not in  dd:
                    dd[count]=paths2
                    count+=1

    print(len(dd))
    end = time.time()
    print('time taken is ', (end-start))


if __name__ == '__main__':
    main()

