function getBallForceVec(zogica, planeti,ozadje) {
    var total = [0, 0, 0, 0];
    var dx, dy, dz, dSkupSQ, dSkup, gforce, dxn, dyn, dzn;
    var G = 6.67384 * Math.pow(10, -11);
    var oddOdSred = Math.sqrt(  zogica.position[0]*zogica.position[0]+
                                zogica.position[1]*zogica.position[1]+
                                zogica.position[2]*zogica.position[2]);

    for (var i = 0; i < planeti.length; i++) {
        dx = planeti[i].vecPosition[0] - zogica.vecPosition[0];
        dy = planeti[i].vecPosition[1] - zogica.vecPosition[1];
        dz = planeti[i].vecPosition[2] - zogica.vecPosition[2];
        dSkupSQ = Math.pow(dx, 2) + Math.pow(dy, 2) + Math.pow(dz, 2);
        dSkup = Math.sqrt(dSkupSQ);
        gforce = G * (planeti[i].mass * zogica.mass) / dSkupSQ;
        dxn = dx / dSkup;
        dyn = dy / dSkup;
        dzn = dz / dSkup;
        total = sumForceV(total, [dxn, dyn, dzn, gforce]);
        if (dSkup <= (zogica.radius + planeti[i].radius)) { //dotik
            //premik ven, da se ne zatakne :D
            var zaPremaknit = (zogica.radius + planeti[i].radius) - dSkup + 1;
            zogica.vecPosition[0] -= zaPremaknit * dxn;
            zogica.vecPosition[1] -= zaPremaknit * dyn;
            zogica.vecPosition[2] -= zaPremaknit * dzn;
            return ([dxn, dyn, dzn, gforce, true]);
        }
    }
    if(oddOdSred >= 1000000*0.5){
        zogica.vecPosition[0] = -  zogica.vecPosition[0];
        zogica.vecPosition[1] = -zogica.vecPosition[1]
        zogica.vecPosition[2] = -zogica.vecPosition[2]
        
    }
    return total;
}

function sumForceV(v1, v2) {
    var rtn = [0, 0, 0, 0];
    for (var i = 0; i < 3; i++) {
        rtn[i] = v1[i] * v1[3] + v2[i] * v2[3];
    }
    rtn[3] = Math.sqrt(Math.pow(rtn[0], 2) + Math.pow(rtn[1], 2) + Math.pow(rtn[2], 2));
    for (var i = 0; i < 3; i++) {
        rtn[i] = rtn[i] / rtn[3];
    }
    return rtn;
}

function distance(o1, o2) {
    var dx = o1.vecPosition[0] - o2.vecPosition[0];
    var dy = o1.vecPosition[1] - o2.vecPosition[1];
    var dz = o1.vecPosition[2] - o2.vecPosition[2];
    return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2) + Math.pow(dz, 2));
}
