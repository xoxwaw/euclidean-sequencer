/*
Arrange Radial Script
Porter L

    > Arrange divs in a euclidian circle in parent

    2 / 3 / 19 : Initial commit
*/
console.log("arrange_radial loaded");

var dot_template = document.createElement('div'); // template for dot to populate circles
dot_template.setAttribute('id', 'dot');



function populate(n){ // populate circle with n dots
  var parent = document.getElementById('circle1');
  parent.innerHTML = '';
  for (var x = 0; x < n; x++){
    var cln = dot_template.cloneNode(true);
    parent.appendChild(cln);
  }
  arrange();
}

function arrange(){ // arrange dots with euclidian spacing

  // fetch children from container div
  var parent = document.getElementById('circle1');
  var children = parent.getElementsByTagName('div');
  console.log(children);

  var rad = parent.offsetWidth / 2;

  var radial_dist = 360 / children.length;

  for (var x = 0; x < children.length; x++){
    var dist_degree = radial_dist * x;
    var dist_radian = dist_degree * (Math.PI / 180);

    var coord_x = Math.cos(dist_radian) * 150 + 125;
    var coord_y = Math.sin(dist_radian) * 150 + 125;

    console.log(coord_x);
    console.log(coord_y);

    children[x].style.bottom = coord_x+'px';
    children[x].style.right = coord_y+'px';
  }
}
