# Photo Mosaic using Python
A repository to create photo mosaics using python3

<img src="https://github.com/Datadolittle/Photo_Mosaic/blob/master/data/mosaic.jpeg" height="550" width="400">


The photo mosaic program requires Pillow and numpy to process the images and matrix manipulation respectively. 

**Install Pillow & numpy**

```
python3 -m pip install --upgrade pip
python3 -m pip install --upgrade Pillow
python3 -m pip install numpy
```


**Test Background Images for 3 Channels**
The mosaic creator will only work for jpeg or jpg formats. This script checks for the proper format and moves unusable images to a new folder. 

```
python scripts/Image_Tester.py --images data/faces 
```

The unusable images will be moved to the Unusable_Images folder and the mosiac is ready for creation. 

**Create Mosaic**

```
python scripts/Mosaic_Creator.py --target target/breakfree.jpg --images data/faces/ --grid 40 74 --output result/faces.jpeg
python scripts/Mosaic_Creator.py --target target/breakfree_20_20.jpg --images data/faces/ --grid 400 700 --output result/faces.jpeg
python scripts/Mosaic_Creator.py --target target/breakfree_30_30.jpg --images data/faces/ --grid 400 700 --output ../assets/img/faces.jpeg
```

