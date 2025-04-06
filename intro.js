import { AMapLoader } from '@amap/amap-jsapi-loader';
import { getHistoryData } from '@/services/dataService';

export default {
    name: 'CityIntro',
    data() {
        return {
            timelineData: [],
            currentYear: '现代',
            map: null,
            historicalMarkers: []
        };
    },
    async mounted() {
        await this.loadHistoryData();
        this.initMap();
        this.initTimeline();
    },
    methods: {
        async loadHistoryData() {
            try {
                const data = await getHistoryData();
                this.timelineData = data;
            } catch (error) {
                console.error('加载历史数据失败:', error);
                this.$message.error('历史数据加载失败');
            }
        },

        async initMap() {
            try {
                const AMap = await AMapLoader.load({
                    key: '37072141923b7d406d63b08285d848fd',
                    version: '2.0',
                    plugins: ['AMap.Marker', 'AMap.InfoWindow']
                });

                this.map = new AMap.Map('history-map', {
                    zoom: 11,
                    center: [118.35646, 35.10333],
                    mapStyle: 'amap://styles/whitesmoke'
                });

                this.renderHistoricalMarkers();
            } catch (error) {
                console.error('地图初始化失败:', error);
            }
        },

        renderHistoricalMarkers() {
            this.clearMarkers();

            this.timelineData.forEach(item => {
                const marker = new AMap.Marker({
                    position: item.position,
                    title: item.title,
                    map: this.map,
                    icon: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_bs.png'
                });

                const infoWindow = new AMap.InfoWindow({
                    content: this.getHistoryContent(item),
                    offset: new AMap.Pixel(0, -30)
                });

                marker.on('click', () => {
                    infoWindow.open(this.map, marker.getPosition());
                });

                this.historicalMarkers.push(marker);
            });
        },

        getHistoryContent(item) {
            return `
        <div class="history-info">
          <h4>${item.title}</h4>
          <p>年代：${item.era}</p>
          <img src="${item.image}" style="width:200px;height:120px;object-fit:cover;">
          <p>${item.description}</p>
        </div>
      `;
        },

        initTimeline() {
            const timeline = new this.$scrollmagic.Controller();

            new this.$scrollmagic.Scene({
                triggerElement: "#timeline-section",
                duration: '80%'
            })
                .on("progress", e => {
                    const index = Math.floor(e.progress * this.timelineData.length);
                    if (this.currentYear !== this.timelineData[index].era) {
                        this.currentYear = this.timelineData[index].era;
                        this.focusOnMarker(index);
                    }
                })
                .addTo(timeline);
        },

        focusOnMarker(index) {
            const marker = this.historicalMarkers[index];
            this.map.setCenter(marker.getPosition());
            this.map.setZoom(15);
        },

        clearMarkers() {
            this.historicalMarkers.forEach(marker => marker.setMap(null));
            this.historicalMarkers = [];
        }
    }
};