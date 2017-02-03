module.exports = function Cart(oldCart) {
    this.items = oldCart.items || {};
    this.totalQty = oldCart.totalQty || 0;
    this.totalPrice = oldCart.totalPrice || 0;

    this.add = function(item, qty) {
        var storedItem = this.items[item.id];
        if (!storedItem) {
            storedItem = this.items[item.id] = {
                item: item,
                qty: 0,
                price: 0
            }
        }

        storedItem.qty += qty;
        storedItem.price = storedItem.item.price * storedItem.qty;

        this.updateCart(); 
    };

    this.getItemList = function() {
        var arr = [];
        for (var id in this.items) {
            arr.push(this.items[id]);
        }
        return arr;
    };

    this.updateCart = function() {
        this.totalQty = this.totalPrice = 0;
        for (var id in this.items) {
            var item = this.items[id];

            this.totalQty += item.qty;
            this.totalPrice += item.price;            
        }
    };
}