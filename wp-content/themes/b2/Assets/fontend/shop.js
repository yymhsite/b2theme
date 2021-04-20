var B2ShopHome = new Vue({
    el:'.shop-home-left',
    data:{
        ids:[],
        data:''
    },
    mounted(){
        const list = this.$el.querySelectorAll('.shop-normal-item')
        for (let i = 0; i < list.length; i++) {
            this.ids.push(list[i].getAttribute('data-id'))
        }
        if(this.ids.length > 0){
            this.getList()
        }
    },
    methods:{
        getList(){
            const ids = {
                ids:this.ids,
                return:{
                    'images':0
                }
            }
            this.$http.post(b2_rest_url+'getShopItemsData',Qs.stringify(ids)).then((res)=>{
                this.data = res.data
                this.$nextTick(()=>{
                    lazyLoadInstance.update()
                })
            })
        },
        go(url){
            window.location.href=url
        }
    }
})

function b2shopflickity(){
    var f = document.querySelector('.shop-cats-list');
    if(f){
            let shop = new Flickity(f,{
                pageDots: false,
                groupCells: true,
                draggable: true,
                prevNextButtons: false,
                freeScroll: true,
                wrapAround:true,
                cellAlign: 'left'
            });
            
            let previous = f.parentNode.querySelector('.shop-previous');
            previous.addEventListener( 'click', function() {
                shop.previous();
            });

            let next = f.parentNode.querySelector('.shop-next');
            next.addEventListener( 'click', function() {
                shop.next();
            });
        
    }
}
    
b2shopflickity()

var b2ShopResout = new Vue({
    el:'#shop-single',
    data:{
        id:0,
        resout:{
            'data':''
        }
    },
    mounted(){
        if(this.$refs.shopRes){
            this.id = this.$refs.shopRes.getAttribute('data-id')
            this.getUserBuyResout()
        }
    },
    methods:{
        //用户购买信息
        getUserBuyResout(){
            this.$http.post(b2_rest_url+'getUserBuyResout','post_id='+this.id).then(res=>{
                this.resout = res.data
            })
        },
    }
})

var B2ShopSingle = new Vue({
    el:'.shop-top-box',
    data:{
        id:0,
        data:'',
        count:1,
        locked:false,
        postData:'',
        carts:'',
        //地址信息
        address:{
            addresses:{}
        },
        showAddressBox:false,
        editAddressKey:'',
        pickedAddress:'',
        selectAddress:false,
        //抽奖
        fir:[0,0,0,0],
        sec:[0,0,0,0],
        resData:{
            fir:0,
            sec:0
        },
        m:5,
        f:'=',
        //邮箱信息
        showEmailBox:false,
        pickedEmail:''
    },
    async mounted(){
        if(this.$refs.shopSingle){

            await localforage.getItem('carts').then(value=>{
                this.carts = value
            })
            
            this.id = this.$refs.shopSingle.getAttribute('data-id')
            const ids = {
                ids:[this.id],
                return:{
                    'images':0,
                    'attrs':0
                }
            }
            this.$http.post(b2_rest_url+'getShopItemsData',Qs.stringify(ids)).then((res)=>{
                this.data = res.data
            })

            
            if(b2token){
                this.getAddress()
                this.getEmail()
            }
        }
    },
    methods:{
        countAdd(){
            if(this.count >= this.data[this.id].stock.total - this.data[this.id].stock.sell) return
            this.count++
        },
        countSub(){
            if(this.count <= 1) return
            this.count--
        },
        postFavoriteAc(){
            b2ContentFooter.postFavoriteAc()
        },
        inCart(){
            if(this.carts && this.carts.hasOwnProperty(this.id)) return true
            return false
        },
        addCart(){
            if(this.carts){
                let newData = Object.assign(this.data,this.carts);
                newData[this.id].count = this.count

                localforage.setItem('carts',newData).then((value)=>{
                    this.carts = value
                    if(typeof b2AsideBar !== 'undefined'){
                        b2AsideBar.updateCarts()
                    }
                })
                
            }else{
                this.data[this.id].count = this.count
                localforage.setItem('carts',this.data).then((value)=>{
                    this.carts = value
                    if(typeof b2AsideBar !== 'undefined'){
                        b2AsideBar.updateCarts()
                    }
                })
            }
        },
        exchange(id){
            
            if(!b2token){
                login.show = true
                return
            }
            if(this.data[id].commodity == 1 && !this.pickedAddress){
                this.$toasted.show('请添加您的收货地址！', { 
                    theme: 'primary', 
                    position: 'top-center', 
                    duration : 4000,
                    type:'error'
                })

                return
            }
            payCredit.data = {
                'title':this.data[id].title,
                'order_price':Calc.Mul(this.data[id].price.current_price,this.count),
                'order_type':'d',
                'order_count':this.count,
                'post_id':id,
                'order_address':this.showAddress(id) ? this.pickedAddress : (this.showEmail(id) ? this.pickedEmail : '')
            }
            payCredit.show = true;
        },
        lottery(id){
            
            if(!b2token){
                login.show = true
                return
            }

            var r = confirm("确定要消费"+Calc.Mul(this.data[id].price.current_price,this.count)+"积分进行抽奖吗？");

            if(r){
                this.m = 30;
                this.lotteryAc()
                this.$http.post(b2_rest_url+'shopLottery','post_id='+id+'&address='+(this.showAddress(id) ? this.pickedAddress : (this.showEmail(id) ? this.pickedEmail : ''))).then(res=>{
                    this.resData = res.data
                }).catch(err=>{
                    this.$toasted.show(err.response.data.message, { 
                        theme: 'primary',
                        position: 'top-center',
                        duration : 4000,
                        type:'error'
                    })
                    this.resData.fir = '1010'
                    this.resData.sec = '0101'
                    this.m = -1
                })
            }
        },
        lotteryAc(){
            this.fir = this.numToStr(b2randomNum(1000,9999));
            this.sec = this.numToStr(b2randomNum(1000,9999));
            this.m--;
            if(this.m <=0 && this.resData.fir !== 0){
                this.fir = this.numToStr(this.resData.fir);
                this.sec = this.numToStr(this.resData.sec);
                if(this.resData.fir !== this.resData.sec){
                    this.f = '≠'
                }else{
                    this.f = '='
                }
                return
            } 
            setTimeout(() => {
                this.lotteryAc()
            }, 100);
        },
        numToStr(num){
            num = num.toString()
            let arr = []
            for (let i = 0; i < num.length; i++) {
                arr.push(num[i])
            }
            return arr
        },
        emptyData(){
            if(typeof this.data === 'object' && this.data !== null){
                return true
            }

            return false
        },
        disabled(id){
            if(this.data == '') return true
            if(!this.data[id].can_buy.allow) return true
            return false
        },
        //邮件信息
        showEmail(id){
            
            if(b2token && this.data != '' && this.emptyData() && this.data[id].commodity == 0){
                return true
            }

            return false
        },
        getEmail(){
            this.$http.post(b2_rest_url+'getEmail').then(res=>{
                this.pickedEmail = res.data
            })
        },
        //地址信息
        showAddress(id){
            
            if(b2token && this.data != '' && this.emptyData() && this.data[id].commodity == 1){
                return true
            }

            return false
        },
        close(){
            this.showAddressBox = false
            this.showEmailBox = false
        },
        getAddress(){
            this.$http.post(b2_rest_url+'getAddresses').then(res=>{
                if(Object.keys(res.data.addresses).length > 0){
                    this.address = res.data
                    this.pickedAddress = this.address.default
                }
            })
        },
        emptyAddress(){
            if(this.address === '') return false

            if(!this.emptyData()) return false
            
            if(this.pickedAddress === '') return false
            
            return true
        },
        deleteAddress(key){
            var r = confirm("确定要删除这个地址吗？");
            if (r == true) {
                this.$http.post(b2_rest_url+'deleteAddress','key='+key).then(res=>{
                    if(res.data){
                        this.address.addresses = res.data.address;
                        if(key === this.address.default){
                            this.address.default = res.data.default
                        }
                        if(this.pickedAddress === key){
                            this.pickedAddress = res.data.default
                        }
                    }
                }).catch(err=>{
                    this.$toasted.show(err.response.data.message, { 
                        theme: 'primary', 
                        position: 'top-center', 
                        duration : 4000,
                        type:'error'
                    })
                })
            } 
            return
        },
        pickedAddressAc(key){
            this.pickedAddress = key
            this.close()
        },
        editAddress(key){
            this.editAddressKey = key
            this.addressEditData = this.address.addresses[key]
        },
        addNewAddress(){
            this.editAddressKey = uuid(8, 16);
            this.addressEditData = []
        },
        saveAddress(){
            this.$http.post(b2_rest_url+'saveAddress','address='+this.addressEditData.address+'&name='+this.addressEditData.name+'&phone='+this.addressEditData.phone+'&key='+this.editAddressKey).then(res=>{
                this.address.addresses = res.data.address;
                this.pickedAddressAc(res.data.key)
                this.editAddressKey = ''
                this.key = ''
            }).catch(err=>{
                this.$toasted.show(err.response.data.message, { 
                    theme: 'primary', 
                    position: 'top-center', 
                    duration : 4000,
                    type:'error'
                })
            })
        },
        reflush(){
            location.reload();
        }
    }
})

function b2randomNum(minNum,maxNum){ 
    switch(arguments.length){ 
        case 1: 
            return parseInt(Math.random()*minNum+1,10); 
        break; 
        case 2: 
            return parseInt(Math.random()*(maxNum-minNum+1)+minNum,10); 
        break; 
            default: 
                return 0; 
            break; 
    } 
} 