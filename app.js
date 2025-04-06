new Vue({
    el: '#app',
    methods: {
        navigateTo(page) {
            switch (page) {
                case 'intro':
                    window.location.href = 'pages/intro.html';
                    break;
                case 'system':
                    window.location.href = 'pages/system.html';
                    break;
                case 'navigation':
                    window.location.href = 'pages/navigation.html';
                    break;
                case 'measurement':
                    window.location.href = 'pages/measurement.html';
                    break;
                case 'attractions':
                    window.location.href = 'pages/attractions.html';
                    break;
                case 'hotels':
                    window.location.href = 'pages/hotels.html';
                    break;
                case 'services':
                    window.location.href = 'pages/services.html';
                    break;
                default:
                    console.log('未知页面');
            }
        }
    }
});