document.querySelectorAll('.size-btn').forEach(button => {
    button.addEventListener('click', function() {
        document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
    });
});


function showAd2() {
    document.getElementById('ad1').style.display = 'none';
    document.getElementById('ad2').style.display = 'block';
    
    setTimeout(() => {
        document.getElementById('loadingGif').style.display = 'none';
        document.getElementById('text1').classList.remove('hidden');

        setTimeout(() => {
            document.getElementById('loadingGif2').classList.remove('hidden');

            setTimeout(() => {
                document.getElementById('loadingGif2').style.display = 'none';
                document.getElementById('text2').classList.remove('hidden');

                setTimeout(() => {
                    document.getElementById('loadingGif3').classList.remove('hidden');

                    setTimeout(() => {
                        document.getElementById('loadingGif3').style.display = 'none';
                        document.getElementById('text3').classList.remove('hidden');

                        setTimeout(() => {
                            document.getElementById('finalButton').classList.remove('hidden');
                        }, 2000);
                    }, 4000);
                }, 2000);
            }, 2000);
        }, 2000);
    }, 3000);
}
