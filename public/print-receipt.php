<?php
// Disable any output buffering to ensure clean JSON
if (ob_get_level()) ob_end_clean();

// Set content type to JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Allow cross-origin requests

// Get order data from the query parameters
$orderId = isset($_GET['orderId']) ? $_GET['orderId'] : null;
$orderData = isset($_GET['orderData']) ? json_decode(urldecode($_GET['orderData']), true) : null;

// Create receipt data array
$receiptData = array();

// Store Header
$obj = new stdClass();
$obj->type = 0; // text
$obj->content = 'FISH2GO';
$obj->bold = 1;
$obj->align = 1; // center
$obj->format = 2; // double height and width
array_push($receiptData, $obj);

// Store Address and Contact Info
$obj = new stdClass();
$obj->type = 0;
$obj->content = 'B7 L6 Fish2Go Bldg., Jose Abad';
$obj->bold = 0;
$obj->align = 1;
$obj->format = 0;
array_push($receiptData, $obj);

$obj = new stdClass();
$obj->type = 0;
$obj->content = 'Santos Ave., Salitran IV';
$obj->bold = 0;
$obj->align = 1;
$obj->format = 0;
array_push($receiptData, $obj);

$obj = new stdClass();
$obj->type = 0;
$obj->content = 'Dasmariñas, Cavite, 4114';
$obj->bold = 0;
$obj->align = 1;
$obj->format = 0;
array_push($receiptData, $obj);

$obj = new stdClass();
$obj->type = 0;
$obj->content = 'fish2go.official@gmail.com';
$obj->bold = 0;
$obj->align = 1;
$obj->format = 0;
array_push($receiptData, $obj);

$obj = new stdClass();
$obj->type = 0;
$obj->content = '(+63) 9994335474';
$obj->bold = 0;
$obj->align = 1;
$obj->format = 0;
array_push($receiptData, $obj);

// Divider line
$obj = new stdClass();
$obj->type = 0;
$obj->content = '--------------------------------';
$obj->bold = 0;
$obj->align = 1;
array_push($receiptData, $obj);

// Receipt details
$receiptNum = isset($orderData['receiptNo']) ? $orderData['receiptNo'] : rand(10000, 99999);
$obj = new stdClass();
$obj->type = 0;
$obj->content = 'Receipt No.: ' . $receiptNum;
$obj->bold = 1;
$obj->align = 0;
array_push($receiptData, $obj);

$date = isset($orderData['date']) ? $orderData['date'] : date('Y-m-d');
$time = isset($orderData['time']) ? $orderData['time'] : date('H:i:s');
$obj = new stdClass();
$obj->type = 0;
$obj->content = 'Date: ' . $date . '   Time: ' . $time;
$obj->bold = 0;
$obj->align = 0;
array_push($receiptData, $obj);

$cashier = isset($orderData['cashier']) ? $orderData['cashier'] : 'John Doe';
$obj = new stdClass();
$obj->type = 0;
$obj->content = 'Cashier: ' . $cashier;
$obj->bold = 0;
$obj->align = 0;
array_push($receiptData, $obj);

$orderNo = isset($orderData['orderNo']) ? $orderData['orderNo'] : 'ORD-' . rand(1000, 9999);
$obj = new stdClass();
$obj->type = 0;
$obj->content = 'Order No.: ' . $orderNo;
$obj->bold = 0;
$obj->align = 0;
array_push($receiptData, $obj);

// Divider line
$obj = new stdClass();
$obj->type = 0;
$obj->content = '--------------------------------';
$obj->bold = 0;
$obj->align = 1;
array_push($receiptData, $obj);

// Item headers
$obj = new stdClass();
$obj->type = 0;
$obj->content = 'ITEM                 QTY           PRICE             AMOUNT';
$obj->bold = 1;
$obj->align = 0;
array_push($receiptData, $obj);

// Divider line
$obj = new stdClass();
$obj->type = 0;
$obj->content = '--------------------------------';
$obj->bold = 0;
$obj->align = 1;
array_push($receiptData, $obj);

// Use order items if provided, otherwise use sample data
$items = isset($orderData['items']) && is_array($orderData['items']) ? $orderData['items'] : [
    ['name' => 'Salmon Fillet', 'qty' => 2, 'price' => 12.99],
    ['name' => 'Tuna Steak', 'qty' => 1, 'price' => 15.98],
    ['name' => 'Sea Bass', 'qty' => 3, 'price' => 10.50],
    ['name' => 'Shrimp', 'qty' => 500, 'price' => 0.05]
];

$subtotal = 0;
foreach ($items as $item) {
    // Get item details
    $name = isset($item['name']) ? $item['name'] : '';
    $qty = isset($item['qty']) ? $item['qty'] : 0;
    $price = isset($item['price']) ? $item['price'] : 0;
    $amount = $qty * $price;
    $subtotal += $amount;
    
    $obj = new stdClass();
    $obj->type = 0;
    $obj->content = str_pad($name, 18) . ' ' . 
                   str_pad($qty, 10, ' ', STR_PAD_LEFT) . ' ' . 
                   str_pad('₱' . number_format($price, 2), 12, ' ', STR_PAD_LEFT) . ' ' . 
                   str_pad('₱' . number_format($amount, 2), 12, ' ', STR_PAD_LEFT);
    $obj->bold = 0;
    $obj->align = 0;
    array_push($receiptData, $obj);
}

// Divider line
$obj = new stdClass();
$obj->type = 0;
$obj->content = '--------------------------------';
$obj->bold = 0;
$obj->align = 1;
array_push($receiptData, $obj);

// Calculate totals or use provided values
$subtotal = isset($orderData['subtotal']) ? $orderData['subtotal'] : $subtotal;
$tax = isset($orderData['tax']) ? $orderData['tax'] : ($subtotal * 0.10);
$discount = isset($orderData['discount']) ? $orderData['discount'] : ($subtotal * 0.05);
$total = isset($orderData['total']) ? $orderData['total'] : ($subtotal + $tax - $discount);
$paymentMethod = isset($orderData['paymentMethod']) ? $orderData['paymentMethod'] : 'Cash';
$cash = isset($orderData['cash']) ? $orderData['cash'] : ceil($total / 5) * 5;
$change = isset($orderData['change']) ? $orderData['change'] : ($cash - $total);

// Add totals
$obj = new stdClass();
$obj->type = 0;
$obj->content = 'Subtotal:         ₱' . number_format($subtotal, 2);
$obj->bold = 0;
$obj->align = 0;
array_push($receiptData, $obj);

$obj = new stdClass();
$obj->type = 0;
$obj->content = 'Tax:              ₱' . number_format($tax, 2);
$obj->bold = 0;
$obj->align = 0;
array_push($receiptData, $obj);

$obj = new stdClass();
$obj->type = 0;
$obj->content = 'Discount:         ₱' . number_format($discount, 2);
$obj->bold = 0;
$obj->align = 0;
array_push($receiptData, $obj);

// Divider line
$obj = new stdClass();
$obj->type = 0;
$obj->content = '--------------------------------';
$obj->bold = 0;
$obj->align = 1;
array_push($receiptData, $obj);

$obj = new stdClass();
$obj->type = 0;
$obj->content = 'Total:            ₱' . number_format($total, 2);
$obj->bold = 1;
$obj->align = 0;
$obj->format = 1;
array_push($receiptData, $obj);

$obj = new stdClass();
$obj->type = 0;
$obj->content = 'Payment Method:               ' . $paymentMethod;
$obj->bold = 0;
$obj->align = 0;
array_push($receiptData, $obj);

if ($paymentMethod === 'Cash') {
    $obj = new stdClass();
    $obj->type = 0;
    $obj->content = 'Cash:          ₱' . number_format($cash, 2);
    $obj->bold = 0;
    $obj->align = 0;
    array_push($receiptData, $obj);

    $obj = new stdClass();
    $obj->type = 0;
    $obj->content = 'Change:        ₱' . number_format($change, 2);
    $obj->bold = 0;
    $obj->align = 0;
    array_push($receiptData, $obj);
}

// Divider line
$obj = new stdClass();
$obj->type = 0;
$obj->content = '--------------------------------';
$obj->bold = 0;
$obj->align = 1;
array_push($receiptData, $obj);

// Thank you message
$obj = new stdClass();
$obj->type = 0;
$obj->content = 'Thank you for your purchase!';
$obj->bold = 0;
$obj->align = 1;
array_push($receiptData, $obj);

// Add empty lines for the cut
$obj = new stdClass();
$obj->type = 0;
$obj->content = '';
$obj->bold = 0;
$obj->align = 0;
array_push($receiptData, $obj);
$obj = new stdClass();
$obj->type = 0;
$obj->content = '';
$obj->bold = 0;
$obj->align = 0;
array_push($receiptData, $obj);
$obj = new stdClass();
$obj->type = 0;
$obj->content = '';
$obj->bold = 0;
$obj->align = 0;
array_push($receiptData, $obj);

// Output the JSON data
echo json_encode($receiptData, JSON_FORCE_OBJECT);
?>
