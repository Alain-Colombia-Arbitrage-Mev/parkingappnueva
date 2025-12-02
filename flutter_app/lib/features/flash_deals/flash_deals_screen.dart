import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/utils/responsive.dart';

class FlashDealsScreen extends ConsumerStatefulWidget {
  const FlashDealsScreen({super.key});

  @override
  ConsumerState<FlashDealsScreen> createState() => _FlashDealsScreenState();
}

class _FlashDealsScreenState extends ConsumerState<FlashDealsScreen> {
  Timer? _countdownTimer;

  // Mock data - esto vendría de Convex
  final List<Map<String, dynamic>> _deals = [
    {
      'id': '1',
      'title': '¡Últimas pizzas del día!',
      'restaurant': {
        'name': 'Pizzería Il Forno',
        'logo': 'https://i.pravatar.cc/150?img=10',
        'cuisine': ['Italiana', 'Pizza'],
        'rating': 4.7,
      },
      'items': [
        {'name': 'Pizza Margarita', 'originalPrice': 35000, 'discountedPrice': 20000, 'quantity': 5},
        {'name': 'Pizza Pepperoni', 'originalPrice': 42000, 'discountedPrice': 25000, 'quantity': 3},
      ],
      'discountPercentage': 40,
      'endTime': DateTime.now().add(const Duration(hours: 1, minutes: 30)),
      'distance': 1.2,
      'claimCount': 8,
    },
    {
      'id': '2',
      'title': 'Sushi fresco antes del cierre',
      'restaurant': {
        'name': 'Tokyo Express',
        'logo': 'https://i.pravatar.cc/150?img=11',
        'cuisine': ['Japonesa', 'Sushi'],
        'rating': 4.9,
      },
      'items': [
        {'name': 'Roll California x12', 'originalPrice': 48000, 'discountedPrice': 28000, 'quantity': 4},
        {'name': 'Nigiri Mixto x8', 'originalPrice': 55000, 'discountedPrice': 32000, 'quantity': 2},
      ],
      'discountPercentage': 45,
      'endTime': DateTime.now().add(const Duration(minutes: 45)),
      'distance': 0.8,
      'claimCount': 12,
    },
    {
      'id': '3',
      'title': 'Hamburguesas gourmet 2x1',
      'restaurant': {
        'name': 'Burger Lab',
        'logo': 'https://i.pravatar.cc/150?img=12',
        'cuisine': ['Americana', 'Hamburguesas'],
        'rating': 4.6,
      },
      'items': [
        {'name': 'Classic Burger', 'originalPrice': 28000, 'discountedPrice': 14000, 'quantity': 10},
        {'name': 'Bacon Deluxe', 'originalPrice': 35000, 'discountedPrice': 17500, 'quantity': 6},
      ],
      'discountPercentage': 50,
      'endTime': DateTime.now().add(const Duration(hours: 2, minutes: 15)),
      'distance': 2.5,
      'claimCount': 5,
    },
  ];

  @override
  void initState() {
    super.initState();
    _startCountdownTimer();
  }

  void _startCountdownTimer() {
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final r = context.responsive;
    const primaryOrange = Color(0xFFFF6B36);

    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      body: CustomScrollView(
        slivers: [
          // App Bar con animación
          SliverAppBar(
            expandedHeight: r.spacing(mobile: 180, smallPhone: 140),
            floating: false,
            pinned: true,
            backgroundColor: primaryOrange,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Color(0xFFFF8A5C),
                      Color(0xFFFF6B36),
                      Color(0xFFE85A2A),
                    ],
                  ),
                ),
                child: SafeArea(
                  child: Padding(
                    padding: EdgeInsets.all(r.spacing(mobile: 20)),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Row(
                          children: [
                            Icon(
                              Icons.local_fire_department,
                              color: Colors.white,
                              size: r.iconSize(mobile: 32),
                            ),
                            SizedBox(width: r.spacing(mobile: 8)),
                            Text(
                              'Ofertas Flash',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: r.fontSize(mobile: 28, smallPhone: 24),
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ).animate().fadeIn().slideX(begin: -0.2, end: 0),
                        SizedBox(height: r.spacing(mobile: 8)),
                        Text(
                          'Descuentos de última hora cerca de ti',
                          style: TextStyle(
                            color: Colors.white.withAlpha(230),
                            fontSize: r.fontSize(mobile: 14),
                          ),
                        ).animate().fadeIn(delay: 200.ms).slideX(begin: -0.2, end: 0),
                        SizedBox(height: r.spacing(mobile: 12)),
                        Container(
                          padding: EdgeInsets.symmetric(
                            horizontal: r.spacing(mobile: 12),
                            vertical: r.spacing(mobile: 6),
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white.withAlpha(51),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.notifications_active,
                                color: Colors.white,
                                size: r.iconSize(mobile: 16),
                              ),
                              SizedBox(width: r.spacing(mobile: 6)),
                              Text(
                                '${_deals.length} ofertas activas',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: r.fontSize(mobile: 12),
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ).animate().fadeIn(delay: 400.ms).scale(begin: const Offset(0.8, 0.8)),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),

          // Deal cards
          SliverPadding(
            padding: EdgeInsets.all(r.spacing(mobile: 16)),
            sliver: SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final deal = _deals[index];
                  return _buildDealCard(deal, r, primaryOrange, index);
                },
                childCount: _deals.length,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDealCard(
    Map<String, dynamic> deal,
    Responsive r,
    Color primaryOrange,
    int index,
  ) {
    final endTime = deal['endTime'] as DateTime;
    final timeRemaining = endTime.difference(DateTime.now());
    final isExpiringSoon = timeRemaining.inMinutes < 60;
    final restaurant = deal['restaurant'] as Map<String, dynamic>;

    return Container(
      margin: EdgeInsets.only(bottom: r.spacing(mobile: 16)),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(13),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header con descuento y tiempo
          Container(
            padding: EdgeInsets.all(r.spacing(mobile: 16)),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: isExpiringSoon
                    ? [Colors.red[400]!, Colors.red[600]!]
                    : [primaryOrange.withAlpha(230), primaryOrange],
              ),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Row(
              children: [
                // Discount badge
                Container(
                  padding: EdgeInsets.symmetric(
                    horizontal: r.spacing(mobile: 12),
                    vertical: r.spacing(mobile: 6),
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '-${deal['discountPercentage']}%',
                    style: TextStyle(
                      color: isExpiringSoon ? Colors.red : primaryOrange,
                      fontSize: r.fontSize(mobile: 18),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                SizedBox(width: r.spacing(mobile: 12)),
                
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        deal['title'],
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: r.fontSize(mobile: 16),
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      SizedBox(height: r.spacing(mobile: 2)),
                      Text(
                        '${deal['claimCount']} personas reservaron',
                        style: TextStyle(
                          color: Colors.white.withAlpha(204),
                          fontSize: r.fontSize(mobile: 12),
                        ),
                      ),
                    ],
                  ),
                ),
                
                // Countdown
                Container(
                  padding: EdgeInsets.symmetric(
                    horizontal: r.spacing(mobile: 10),
                    vertical: r.spacing(mobile: 6),
                  ),
                  decoration: BoxDecoration(
                    color: Colors.black.withAlpha(51),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.timer,
                        color: Colors.white,
                        size: r.iconSize(mobile: 16),
                      ),
                      SizedBox(width: r.spacing(mobile: 4)),
                      Text(
                        _formatTimeRemaining(timeRemaining),
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: r.fontSize(mobile: 13),
                          fontWeight: FontWeight.bold,
                          fontFamily: 'monospace',
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // Restaurant info
          Padding(
            padding: EdgeInsets.all(r.spacing(mobile: 16)),
            child: Row(
              children: [
                // Logo
                Container(
                  width: r.iconSize(mobile: 50),
                  height: r.iconSize(mobile: 50),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey[200]!),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(11),
                    child: Image.network(
                      restaurant['logo'],
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        color: Colors.grey[100],
                        child: Icon(
                          Icons.restaurant,
                          color: Colors.grey[400],
                        ),
                      ),
                    ),
                  ),
                ),
                SizedBox(width: r.spacing(mobile: 12)),
                
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        restaurant['name'],
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: r.fontSize(mobile: 15),
                        ),
                      ),
                      SizedBox(height: r.spacing(mobile: 4)),
                      Row(
                        children: [
                          Icon(
                            Icons.star,
                            color: Colors.amber,
                            size: r.iconSize(mobile: 14),
                          ),
                          SizedBox(width: r.spacing(mobile: 2)),
                          Text(
                            '${restaurant['rating']}',
                            style: TextStyle(
                              fontSize: r.fontSize(mobile: 12),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          SizedBox(width: r.spacing(mobile: 8)),
                          Icon(
                            Icons.location_on_outlined,
                            color: Colors.grey,
                            size: r.iconSize(mobile: 14),
                          ),
                          Text(
                            '${deal['distance']} km',
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontSize: r.fontSize(mobile: 12),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // Items
          Padding(
            padding: EdgeInsets.symmetric(horizontal: r.spacing(mobile: 16)),
            child: Column(
              children: (deal['items'] as List).map((item) {
                return Padding(
                  padding: EdgeInsets.only(bottom: r.spacing(mobile: 10)),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item['name'],
                              style: TextStyle(
                                fontSize: r.fontSize(mobile: 14),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            if (item['quantity'] != null)
                              Text(
                                'Quedan ${item['quantity']} disponibles',
                                style: TextStyle(
                                  color: item['quantity'] <= 3 
                                      ? Colors.red 
                                      : Colors.grey[600],
                                  fontSize: r.fontSize(mobile: 11),
                                ),
                              ),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '\$${_formatPrice(item['originalPrice'])}',
                            style: TextStyle(
                              color: Colors.grey[500],
                              fontSize: r.fontSize(mobile: 12),
                              decoration: TextDecoration.lineThrough,
                            ),
                          ),
                          Text(
                            '\$${_formatPrice(item['discountedPrice'])}',
                            style: TextStyle(
                              color: primaryOrange,
                              fontSize: r.fontSize(mobile: 15),
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
          
          // Action button
          Padding(
            padding: EdgeInsets.all(r.spacing(mobile: 16)),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => _showClaimDialog(deal),
                style: ElevatedButton.styleFrom(
                  backgroundColor: primaryOrange,
                  foregroundColor: Colors.white,
                  padding: EdgeInsets.symmetric(vertical: r.spacing(mobile: 14)),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.shopping_bag_outlined, size: r.iconSize(mobile: 20)),
                    SizedBox(width: r.spacing(mobile: 8)),
                    Text(
                      'Reservar ahora',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: r.fontSize(mobile: 15),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    ).animate()
      .fadeIn(delay: Duration(milliseconds: index * 150))
      .slideY(begin: 0.1, end: 0);
  }

  String _formatTimeRemaining(Duration duration) {
    if (duration.isNegative) return '¡Expirado!';
    
    final hours = duration.inHours;
    final minutes = duration.inMinutes % 60;
    final seconds = duration.inSeconds % 60;
    
    if (hours > 0) {
      return '${hours}h ${minutes}m';
    }
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  String _formatPrice(int price) {
    return price.toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]},',
    );
  }

  void _showClaimDialog(Map<String, dynamic> deal) {
    final r = context.responsive;
    const primaryOrange = Color(0xFFFF6B36);
    final items = deal['items'] as List;
    final quantities = List<int>.filled(items.length, 0);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          int total = 0;
          for (int i = 0; i < items.length; i++) {
            total += (items[i]['discountedPrice'] as int) * quantities[i];
          }

          return Container(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.8,
            ),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Handle
                Padding(
                  padding: EdgeInsets.symmetric(vertical: r.spacing(mobile: 12)),
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                
                // Title
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: r.spacing(mobile: 20)),
                  child: Row(
                    children: [
                      Text(
                        'Reservar',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: r.fontSize(mobile: 20),
                        ),
                      ),
                      const Spacer(),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                ),
                
                Divider(color: Colors.grey[200]),
                
                // Items list
                Flexible(
                  child: ListView.builder(
                    shrinkWrap: true,
                    padding: EdgeInsets.all(r.spacing(mobile: 20)),
                    itemCount: items.length,
                    itemBuilder: (context, index) {
                      final item = items[index];
                      final available = item['quantity'] ?? 99;
                      
                      return Padding(
                        padding: EdgeInsets.only(bottom: r.spacing(mobile: 16)),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item['name'],
                                    style: TextStyle(
                                      fontWeight: FontWeight.w600,
                                      fontSize: r.fontSize(mobile: 15),
                                    ),
                                  ),
                                  Text(
                                    '\$${_formatPrice(item['discountedPrice'])}',
                                    style: TextStyle(
                                      color: primaryOrange,
                                      fontWeight: FontWeight.bold,
                                      fontSize: r.fontSize(mobile: 14),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            // Quantity selector
                            Row(
                              children: [
                                IconButton(
                                  icon: Icon(
                                    Icons.remove_circle_outline,
                                    color: quantities[index] > 0 
                                        ? primaryOrange 
                                        : Colors.grey[300],
                                  ),
                                  onPressed: quantities[index] > 0
                                      ? () => setModalState(() => quantities[index]--)
                                      : null,
                                ),
                                SizedBox(
                                  width: 30,
                                  child: Text(
                                    '${quantities[index]}',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: r.fontSize(mobile: 16),
                                    ),
                                  ),
                                ),
                                IconButton(
                                  icon: Icon(
                                    Icons.add_circle_outline,
                                    color: quantities[index] < available 
                                        ? primaryOrange 
                                        : Colors.grey[300],
                                  ),
                                  onPressed: quantities[index] < available
                                      ? () => setModalState(() => quantities[index]++)
                                      : null,
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
                
                // Total and confirm
                Container(
                  padding: EdgeInsets.all(r.spacing(mobile: 20)),
                  decoration: BoxDecoration(
                    color: Colors.grey[50],
                    border: Border(
                      top: BorderSide(color: Colors.grey[200]!),
                    ),
                  ),
                  child: SafeArea(
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Total:',
                              style: TextStyle(
                                fontSize: r.fontSize(mobile: 16),
                              ),
                            ),
                            Text(
                              '\$${_formatPrice(total)}',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: r.fontSize(mobile: 22),
                                color: primaryOrange,
                              ),
                            ),
                          ],
                        ),
                        SizedBox(height: r.spacing(mobile: 16)),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: total > 0
                                ? () {
                                    Navigator.pop(context);
                                    _showConfirmation(deal);
                                  }
                                : null,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: primaryOrange,
                              foregroundColor: Colors.white,
                              disabledBackgroundColor: Colors.grey[300],
                              padding: EdgeInsets.symmetric(
                                vertical: r.spacing(mobile: 16),
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: Text(
                              'Confirmar Reserva',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: r.fontSize(mobile: 16),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showConfirmation(Map<String, dynamic> deal) {
    final r = context.responsive;
    const primaryOrange = Color(0xFFFF6B36);
    final restaurant = deal['restaurant'] as Map<String, dynamic>;
    const pickupCode = 'ABC123';

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: EdgeInsets.all(r.spacing(mobile: 24)),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: r.iconSize(mobile: 70),
                height: r.iconSize(mobile: 70),
                decoration: BoxDecoration(
                  color: Colors.green.withAlpha(25),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.check_circle,
                  color: Colors.green,
                  size: r.iconSize(mobile: 50),
                ),
              ).animate().scale(
                duration: 500.ms,
                curve: Curves.elasticOut,
              ),
              SizedBox(height: r.spacing(mobile: 20)),
              
              Text(
                '¡Reserva Confirmada!',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: r.fontSize(mobile: 20),
                ),
              ),
              SizedBox(height: r.spacing(mobile: 12)),
              
              Text(
                'Presenta este código en ${restaurant['name']}',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: r.fontSize(mobile: 14),
                ),
              ),
              SizedBox(height: r.spacing(mobile: 20)),
              
              // Pickup code
              Container(
                padding: EdgeInsets.symmetric(
                  horizontal: r.spacing(mobile: 24),
                  vertical: r.spacing(mobile: 16),
                ),
                decoration: BoxDecoration(
                  color: primaryOrange.withAlpha(25),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: primaryOrange.withAlpha(76),
                    width: 2,
                  ),
                ),
                child: Text(
                  pickupCode,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: r.fontSize(mobile: 32),
                    color: primaryOrange,
                    letterSpacing: 4,
                  ),
                ),
              ).animate().fadeIn(delay: 300.ms),
              SizedBox(height: r.spacing(mobile: 24)),
              
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryOrange,
                    foregroundColor: Colors.white,
                    padding: EdgeInsets.symmetric(vertical: r.spacing(mobile: 14)),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: Text(
                    'Ver mis reservas',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: r.fontSize(mobile: 15),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

