// 初始化高德地图
function initMap(containerId, options = {}) {
    const defaultOptions = {
        zoom: 12,
        center: [118.35646, 35.10333], // 临沂市中心坐标
        viewMode: '2D',
        mapStyle: 'amap://styles/normal'
    };

    const map = new AMap.Map(containerId, { ...defaultOptions, ...options });
    return map;
}

// 添加导航功能
function addNavigation(map) {
    AMap.plugin(['AMap.ToolBar', 'AMap.Driving'], function () {
        // 添加工具条
        map.addControl(new AMap.ToolBar());

        // 创建驾车导航
        const driving = new AMap.Driving({
            map: map,
            panel: 'panel'
        });

        // 导航搜索
        window.searchRoute = function () {
            const start = document.getElementById('start').value;
            const end = document.getElementById('end').value;

            driving.search([
                { keyword: start, city: '临沂' },
                { keyword: end, city: '临沂' }
            ], function (status, result) {
                // 处理结果
            });
        };
    });
}

// 添加量算功能
function addMeasurement(map) {
    AMap.plugin(['AMap.RangingTool'], function () {
        const rangeTool = new AMap.RangingTool(map);

        document.getElementById('start-measure').addEventListener('click', function () {
            rangeTool.turnOn();
        });
    });
}

// 添加景点标记
function addAttractions(map) {
    const attractions = [
        {
            name: "临沂市博物馆",
            position: [118.3478, 35.0726],
            content: "展示临沂历史文化的重要场所"
        },
        {
            name: "沂蒙山旅游区",
            position: [118.2, 35.6],
            content: "国家5A级旅游景区，红色旅游胜地"
        },
        {
            name: "王羲之故居",
            position: [118.35, 35.06],
            content: "书圣王羲之的故居遗址"
        }
    ];

    attractions.forEach(attraction => {
        const marker = new AMap.Marker({
            position: attraction.position,
            title: attraction.name,
            map: map
        });

        const infoWindow = new AMap.InfoWindow({
            content: `<h3>${attraction.name}</h3><p>${attraction.content}</p>`,
            offset: new AMap.Pixel(0, -30)
        });

        marker.on('click', function () {
            infoWindow.open(map, marker.getPosition());
        });
    });
}

// 添加酒店标记
function addHotels(map) {
    const hotels = [
        {
            name: "临沂蓝海国际大饭店",
            position: [118.356, 35.105],
            tel: "0539-8968888"
        },
        {
            name: "临沂鲁商铂尔曼大酒店",
            position: [118.348, 35.102],
            tel: "0539-8188888"
        }
    ];

    hotels.forEach(hotel => {
        const marker = new AMap.Marker({
            position: hotel.position,
            title: hotel.name,
            map: map,
            icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png'
        });

        const infoWindow = new AMap.InfoWindow({
            content: `<h3>${hotel.name}</h3><p>电话: ${hotel.tel}</p>`,
            offset: new AMap.Pixel(0, -30)
        });

        marker.on('click', function () {
            infoWindow.open(map, marker.getPosition());
        });
    });
}