notes on quaternion rotations
june 6, 2017

--


serverdial.js is based on this tutorial for working with the gyroscope:
http://www.asterixcreative.com/blog/mobile-gyroscope-with-javascript-and-quaternions-programming-tutorial-part-1/

there are two ways to model 3d transformations --

1. euler angles
2. axis angles 
(3. quaternions)

---

1. euler angles 

euler angles describe the rotations around each of three axis (x,y,z) to 
specify a 3d transformation (movement from one 3d coordinate to another). 
euler angles use the underlying metaphor of a gyroscope toy where three 
rings at orthagonal angles to each other in 3d space enclose an object at 
the center and describe its orientation. euler angles are written as three 
angles of rotation which describe the rotation of each of the three rings. 
the order in which these are applied is important and changing that order 
changes the result. in the tutorial, this is z > x > y.

      y z
      | / 
      |/
  ----+----x
     /|
    / |

[https://en.wikipedia.org/wiki/Euler_angles](https://en.wikipedia.org/wiki/Euler_angles)

(https://en.wikipedia.org/wiki/Euler_angles)

---

2. axis angles

axis angles represent a 3d rotation as a combination of a 3d unit vector and 
an angle of rotation around that vector. the 3d vector has the form of 
(x,y,z)-> where (x,y,z) defines the endpoint of a vector from the origin. 
vectors always have direction implicitly. in this case, this more compact 
notation overcomes the possibilty of gimbal lock (all three rings in the 
same plane) which can result when using euler angles. axis angle notation is 
used to derive the quaternion.

      y  z
      | / 
      |/
  ----+----x
     /|
    / |

https://en.wikipedia.org/wiki/Axis–angle_representation

--

3. quaternion

ok, this is the big and elegant way to represent 3d rotations and 
transformations. quaternions extend the complex numbers and have the form a 
+ bi + cj + dk. for 3d rotations, quaternions are handy as multiple 
transformations can be applied one after the other. quaternions are (quasi-) 
normalized axis angles across a complex number system. in a quaternion, each 
of the 4 values that compose the number are ranged between 0-1. so

x,y,z,w

where x is "amount" or influence of x axis, y is "amount" of y axis, z is 
"amount" of z and w is the rotation around this vector.  the "amounts" are 
derived from axis angle representation in a formula described on the 
wikipedia page below and also in the tutorial above.

(https://en.wikipedia.org/wiki/Quaternion)

https://en.wikipedia.org/wiki/Quaternion

--

\* in general practice, quaternions are faster and more elegant. euler angles 
are easier to understand, so 3d systems often bury the computation with 
quaternions and expose euler angles in the interface. axis angles are more 
or less a halfway house between the two, but also one that is much easier to 
read and understand.

--

q.e.d. for now.
