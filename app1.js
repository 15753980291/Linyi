// 初始化地图
var map = new AMap.Map('container', {
    zoom: 12,
    center: [118.35646, 35.10333], // 临沂市中心坐标
    viewMode: '3D'
});

// 添加临沂市边界
var district = null;
function addDistrict() {
    // 加载行政区划插件
    AMap.plugin('AMap.DistrictSearch', function () {
        district = new AMap.DistrictSearch({
            extensions: 'all',
            level: 'city'
        });
        // 搜索临沂市
        district.search('临沂市', function (status, result) {
            if (status === 'complete') {
                var bounds = result.districtList[0].boundaries;
                var polygons = [];
                for (var i = 0; i < bounds.length; i++) {
                    // 生成行政区划polygon
                    polygons.push(new AMap.Polygon({
                        map: map,
                        strokeWeight: 1,
                        path: bounds[i],
                        fillOpacity: 0.2,
                        fillColor: '#80d8ff',
                        strokeColor: '#0091ea'
                    }));
                }
                // 自适应显示
                map.setFitView();
            }
        });
    });
}
addDistrict();

// 添加文旅POI点
var pois = [
    { name: "临沂市博物馆", lnglat: [118.35646, 35.10333], address: "兰山区沂蒙路156号", tel: "0539-12345678" },
    { name: "王羲之故居", lnglat: [118.3468, 35.0634], address: "兰山区洗砚池街21号", tel: "0539-87654321" },
    { name: "临沂动植物园", lnglat: [118.4089, 35.0225], address: "河东区沭河大道与厦门路交汇处", tel: "0539-23456789" },
    { name: "沂蒙山银座天蒙旅游区", lnglat: [117.9756, 35.4567], address: "费县薛庄镇", tel: "0539-34567890" },
    { name: "竹泉村", lnglat: [118.4567, 35.2345], address: "沂南县铜井镇", tel: "0539-45678901" },
    { name: "临沂人民公园", lnglat: [118.3421, 35.0789], address: "兰山区银雀山路127号", tel: "0539-56789012" },
    { name: "临沂书法广场", lnglat: [118.3245, 35.0912], address: "兰山区滨河路", tel: "0539-67890123" },
    { name: "临沂科技馆", lnglat: [118.3789, 35.0678], address: "兰山区府右路8号", tel: "0539-78901234" }
];

var markers = [];
var defaultLayerVisible = true;

function addPois() {
    // 清除现有标记
    markers.forEach(marker => marker.setMap(null));
    markers = [];

    if (!document.getElementById('default-layer').checked) return;

    for (var i = 0; i < pois.length; i++) {
        var marker = new AMap.Marker({
            position: pois[i].lnglat,
            title: pois[i].name,
            map: map,
            icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png'
        });

        marker.on('click', function (e) {
            var poi = pois.find(p => p.lnglat[0] === e.target.getPosition().lng && p.lnglat[1] === e.target.getPosition().lat);
            if (poi) {
                document.getElementById('poi-title').innerText = poi.name;
                document.getElementById('poi-address').innerText = '地址: ' + poi.address;
                document.getElementById('poi-tel').innerText = '电话: ' + poi.tel;
                document.getElementById('poi-info').style.display = 'block';

                // 存储当前点击的POI位置
                currentPoi = {
                    name: poi.name,
                    lnglat: poi.lnglat
                };
            }
        });

        markers.push(marker);
    }
}
addPois();

// 加载临沂景点图层
var lyLayer = null;
var lyLayerVisible = true;

function loadLYLayer() {
    if (!document.getElementById('ly-layer').checked) return;

    // 使用Fetch API获取GeoJSON数据
    fetch('https://www.geosceneonline.cn/server/rest/services/Hosted/%E4%B8%B4%E6%B2%82/FeatureServer/0/query?where=1%3D1&outFields=*&f=geojson')
        .then(response => response.json())
        .then(data => {
            // 将GeoJSON转换为高德地图可用的格式
            data.features.forEach(feature => {
                if (feature.geometry.type === 'Point') {
                    var lnglat = [feature.geometry.coordinates[0], feature.geometry.coordinates[1]];
                    var marker = new AMap.Marker({
                        position: lnglat,
                        map: map,
                        title: feature.properties.NAME || '景点',
                        content: '<div style="background-color: #FF6A00; width: 24px; height: 24px; border-radius: 50%; color: white; text-align: center; line-height: 24px;">景</div>'
                    });

                    marker.on('click', function (e) {
                        var props = feature.properties;
                        document.getElementById('poi-title').innerText = props.NAME || '景点';
                        document.getElementById('poi-address').innerText = '地址: ' + (props.ADDRESS || '未知');
                        document.getElementById('poi-tel').innerText = '电话: ' + (props.TEL || '未知');
                        document.getElementById('poi-info').style.display = 'block';

                        // 存储当前点击的POI位置
                        currentPoi = {
                            name: props.NAME || '景点',
                            lnglat: lnglat
                        };
                    });

                    if (!lyLayer) lyLayer = [];
                    lyLayer.push(marker);
                }
            });
        })
        .catch(error => {
            console.error('加载临沂景点图层失败:', error);
        });
}
loadLYLayer();

// 图层控制
document.getElementById('ly-layer').addEventListener('change', function () {
    lyLayerVisible = this.checked;
    if (lyLayer) {
        lyLayer.forEach(marker => marker.setMap(lyLayerVisible ? map : null));
    } else if (lyLayerVisible) {
        loadLYLayer();
    }
});

document.getElementById('default-layer').addEventListener('change', function () {
    defaultLayerVisible = this.checked;
    addPois();
});

// 路径规划相关变量
var startMarker, endMarker;
var routePolicy = 'LEAST_TIME'; // 默认策略
var routeType = 'drive'; // 默认驾车
var driving, walking, transit, riding, taxi;
var currentPoi = null; // 当前点击的POI

// 初始化路径规划插件
AMap.plugin([
    'AMap.Driving',
    'AMap.Walking',
    'AMap.Transfer',
    'AMap.Riding',
    'AMap.Taxi'
], function () {
    driving = new AMap.Driving({
        map: map,
        policy: routePolicy,
        showTraffic: true,
        hideMarkers: false
    });

    walking = new AMap.Walking({
        map: map,
        hideMarkers: false
    });

    transit = new AMap.Transfer({
        map: map,
        city: '临沂',
        hideMarkers: false
    });

    riding = new AMap.Riding({
        map: map,
        hideMarkers: false
    });

    taxi = new AMap.Taxi({
        map: map,
        hideMarkers: false
    });
});

// 设为起点/终点
document.getElementById('set-start').addEventListener('click', function () {
    if (currentPoi) {
        document.getElementById('start').value = currentPoi.name;
        addStartMarker(currentPoi.lnglat);
        document.getElementById('poi-info').style.display = 'none';
    }
});

document.getElementById('set-end').addEventListener('click', function () {
    if (currentPoi) {
        document.getElementById('end').value = currentPoi.name;
        addEndMarker(currentPoi.lnglat);
        document.getElementById('poi-info').style.display = 'none';
    }
});

// 搜索路线
document.getElementById('search-btn').addEventListener('click', function () {
    var start = document.getElementById('start').value;
    var end = document.getElementById('end').value;

    if (!start || !end) {
        alert('请输入起点和终点');
        return;
    }

    // 清除之前的路线
    clearRoute();

    // 搜索起点和终点
    AMap.plugin('AMap.PlaceSearch', function () {
        var placeSearch = new AMap.PlaceSearch({
            city: '临沂'
        });

        // 搜索起点
        placeSearch.search(start, function (status, result) {
            if (status === 'complete' && result.poiList.pois.length > 0) {
                var startPoi = result.poiList.pois[0];
                addStartMarker(startPoi.location);

                // 搜索终点
                placeSearch.search(end, function (status, result) {
                    if (status === 'complete' && result.poiList.pois.length > 0) {
                        var endPoi = result.poiList.pois[0];
                        addEndMarker(endPoi.location);

                        // 根据选择的交通方式规划路线
                        searchRoute(startPoi.location, endPoi.location);
                    } else {
                        alert('未找到终点位置');
                    }
                });
            } else {
                alert('未找到起点位置');
            }
        });
    });
});

// 添加起点标记
function addStartMarker(lnglat) {
    if (startMarker) {
        startMarker.setMap(null);
    }
    startMarker = new AMap.Marker({
        position: lnglat,
        icon: 'https://webapi.amap.com/theme/v1.3/markers/n/start.png',
        map: map
    });
}

// 添加终点标记
function addEndMarker(lnglat) {
    if (endMarker) {
        endMarker.setMap(null);
    }
    endMarker = new AMap.Marker({
        position: lnglat,
        icon: 'https://webapi.amap.com/theme/v1.3/markers/n/end.png',
        map: map
    });
}

// 根据交通方式搜索路线
function searchRoute(start, end) {
    // 显示路线面板
    document.getElementById('route-panel').style.display = 'block';
    document.getElementById('route-list').innerHTML = '';

    switch (routeType) {
        case 'drive':
            driving.search(new AMap.LngLat(start.lng, start.lat), new AMap.LngLat(end.lng, end.lat), function (status, result) {
                if (status === 'complete') {
                    showRouteResult(result);
                } else {
                    alert('驾车路线规划失败');
                }
            });
            break;
        case 'walk':
            walking.search(new AMap.LngLat(start.lng, start.lat), new AMap.LngLat(end.lng, end.lat), function (status, result) {
                if (status === 'complete') {
                    showRouteResult(result);
                } else {
                    alert('步行路线规划失败');
                }
            });
            break;
        case 'bus':
            transit.search(new AMap.LngLat(start.lng, start.lat), new AMap.LngLat(end.lng, end.lat), function (status, result) {
                if (status === 'complete') {
                    showRouteResult(result);
                } else {
                    alert('公交路线规划失败');
                }
            });
            break;
        case 'ride':
            riding.search(new AMap.LngLat(start.lng, start.lat), new AMap.LngLat(end.lng, end.lat), function (status, result) {
                if (status === 'complete') {
                    showRouteResult(result);
                } else {
                    alert('骑行路线规划失败');
                }
            });
            break;
        case 'taxi':
            taxi.search(new AMap.LngLat(start.lng, start.lat), new AMap.LngLat(end.lng, end.lat), function (status, result) {
                if (status === 'complete') {
                    showRouteResult(result);
                } else {
                    alert('打车路线规划失败');
                }
            });
            break;
    }
}

// 显示路线结果
function showRouteResult(result) {
    var routeList = document.getElementById('route-list');
    routeList.innerHTML = '';

    if (routeType === 'bus') {
        // 公交路线
        for (var i = 0; i < result.plans.length; i++) {
            var plan = result.plans[i];
            var item = document.createElement('div');
            item.className = 'route-item';
            if (i === 0) item.classList.add('active');

            var html = '<h5>方案' + (i + 1) + '</h5>';
            html += '<p>预计时间: ' + (plan.time / 60).toFixed(0) + '分钟</p>';
            html += '<p>步行距离: ' + (plan.walking_distance / 1000).toFixed(1) + '公里</p>';
            html += '<p>费用: ' + (plan.cost || '未知') + '元</p>';

            item.innerHTML = html;
            item.addEventListener('click', function (index) {
                return function () {
                    // 高亮显示选中的路线
                    var items = document.querySelectorAll('.route-item');
                    items.forEach(function (el) {
                        el.classList.remove('active');
                    });
                    items[index].classList.add('active');

                    // 显示路线详情
                    transit.searchOnAMAP({
                        origin: result.origin,
                        destination: result.destination,
                        strategy: result.plans[index].strategy
                    });
                };
            }(i));

            routeList.appendChild(item);
        }
    } else {
        // 其他路线
        for (var i = 0; i < result.routes.length; i++) {
            var route = result.routes[i];
            var item = document.createElement('div');
            item.className = 'route-item';
            if (i === 0) item.classList.add('active');

            var html = '<h5>方案' + (i + 1) + '</h5>';
            html += '<p>预计时间: ' + (route.time / 60).toFixed(0) + '分钟</p>';
            html += '<p>距离: ' + (route.distance / 1000).toFixed(1) + '公里</p>';

            if (routeType === 'taxi') {
                html += '<p>费用: ' + (route.taxi_cost || '未知') + '元</p>';
            }

            item.innerHTML = html;
            item.addEventListener('click', function (index) {
                return function () {
                    // 高亮显示选中的路线
                    var items = document.querySelectorAll('.route-item');
                    items.forEach(function (el) {
                        el.classList.remove('active');
                    });
                    items[index].classList.add('active');

                    // 显示路线详情
                    if (routeType === 'drive') {
                        driving.searchOnAMAP({
                            origin: result.origin,
                            destination: result.destination,
                            policy: routePolicy
                        });
                    } else if (routeType === 'walk') {
                        walking.searchOnAMAP({
                            origin: result.origin,
                            destination: result.destination
                        });
                    } else if (routeType === 'ride') {
                        riding.searchOnAMAP({
                            origin: result.origin,
                            destination: result.destination
                        });
                    } else if (routeType === 'taxi') {
                        taxi.searchOnAMAP({
                            origin: result.origin,
                            destination: result.destination
                        });
                    }
                };
            }(i));

            routeList.appendChild(item);
        }
    }
}

// 清除路线
function clearRoute() {
    if (driving) driving.clear();
    if (walking) walking.clear();
    if (transit) transit.clear();
    if (riding) riding.clear();
    if (taxi) taxi.clear();

    if (startMarker) {
        startMarker.setMap(null);
        startMarker = null;
    }

    if (endMarker) {
        endMarker.setMap(null);
        endMarker = null;
    }

    document.getElementById('route-panel').style.display = 'none';
}

document.getElementById('clear-btn').addEventListener('click', clearRoute);

// 交通方式切换
document.getElementById('walk-btn').addEventListener('click', function () {
    routeType = 'walk';
    document.getElementById('search-btn').click();
});

document.getElementById('drive-btn').addEventListener('click', function () {
    routeType = 'drive';
    document.getElementById('search-btn').click();
});

document.getElementById('bus-btn').addEventListener('click', function () {
    routeType = 'bus';
    document.getElementById('search-btn').click();
});

document.getElementById('ride-btn').addEventListener('click', function () {
    routeType = 'ride';
    document.getElementById('search-btn').click();
});

document.getElementById('taxi-btn').addEventListener('click', function () {
    routeType = 'taxi';
    document.getElementById('search-btn').click();
});

// 自动完成
AMap.plugin(['AMap.AutoComplete', 'AMap.PlaceSearch'], function () {
    var autoOptions = {
        input: 'start'
    };
    var autoComplete1 = new AMap.AutoComplete(autoOptions);
    var placeSearch1 = new AMap.PlaceSearch({
        map: map,
        city: '临沂'
    });
    AMap.event.addListener(autoComplete1, "select", function (e) {
        placeSearch1.search(e.poi.name);
    });

    autoOptions.input = 'end';
    var autoComplete2 = new AMap.AutoComplete(autoOptions);
    var placeSearch2 = new AMap.PlaceSearch({
        map: map,
        city: '临沂'
    });
    AMap.event.addListener(autoComplete2, "select", function (e) {
        placeSearch2.search(e.poi.name);
    });
});