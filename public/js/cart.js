

async function removeItem(productId) {
    try {
        const response = await fetch('/cart/remove', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Cookies.get('token')}`
            },
            body: JSON.stringify({ productId })
        });

        if (response.ok) {
            const data = await response.json();
            alert('Item removed successfully');
            window.location.reload(); // Refresh the page to update the cart
        } else {
            const errorText = await response.text();
            alert(`Error: ${errorText}`);
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

async function clearCart() {
    try {
        const response = await fetch('/cart/clear', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Cookies.get('token')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            alert('Cart cleared successfully');
            window.location.reload(); // Refresh the page to update the cart
        } else {
            const errorText = await response.text();
            alert(`Error: ${errorText}`);
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

async function checkout() {
    try {
        const response = await fetch('/cart/order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Cookies.get('token')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            alert('Order placed successfully');
            window.location.href = '/orders'; // Redirect to orders page
        } else {
            const errorText = await response.text();
            alert(`Error: ${errorText}`);
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}
