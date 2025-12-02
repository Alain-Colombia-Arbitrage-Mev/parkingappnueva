import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../core/utils/responsive.dart';

class AuctionListScreen extends ConsumerStatefulWidget {
  const AuctionListScreen({super.key});

  @override
  ConsumerState<AuctionListScreen> createState() => _AuctionListScreenState();
}

class _AuctionListScreenState extends ConsumerState<AuctionListScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _selectedCategory = 'Todos';
  
  final List<String> _categories = [
    'Todos',
    'Plomería',
    'Electricidad',
    'Carpintería',
    'Pintura',
    'Limpieza',
    'Jardinería',
  ];

  // Mock data - esto vendría de Convex
  final List<Map<String, dynamic>> _auctions = [
    {
      'id': '1',
      'title': 'Reparación de tubería en baño',
      'category': 'Plomería',
      'initialOffer': 150000,
      'currentBestBid': 120000,
      'bidCount': 5,
      'timeRemaining': const Duration(hours: 2, minutes: 30),
      'isUrgent': true,
      'client': {'name': 'María G.', 'rating': 4.8},
      'location': 'Chapinero, Bogotá',
    },
    {
      'id': '2',
      'title': 'Instalación de lámparas LED',
      'category': 'Electricidad',
      'initialOffer': 200000,
      'currentBestBid': 180000,
      'bidCount': 3,
      'timeRemaining': const Duration(hours: 5, minutes: 15),
      'isUrgent': false,
      'client': {'name': 'Carlos R.', 'rating': 4.5},
      'location': 'Usaquén, Bogotá',
    },
    {
      'id': '3',
      'title': 'Pintura de sala y comedor',
      'category': 'Pintura',
      'initialOffer': 350000,
      'currentBestBid': 280000,
      'bidCount': 8,
      'timeRemaining': const Duration(hours: 1, minutes: 45),
      'isUrgent': true,
      'client': {'name': 'Ana M.', 'rating': 4.9},
      'location': 'Suba, Bogotá',
    },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final r = context.responsive;
    const primaryOrange = Color(0xFFFF6B36);

    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(
          'Subastas',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: r.fontSize(mobile: 20),
            color: Colors.black,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list, color: Colors.black87),
            onPressed: _showFilters,
          ),
          IconButton(
            icon: const Icon(Icons.search, color: Colors.black87),
            onPressed: _showSearch,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelColor: primaryOrange,
          unselectedLabelColor: Colors.grey,
          indicatorColor: primaryOrange,
          tabs: const [
            Tab(text: 'Activas'),
            Tab(text: 'Mis Pujas'),
          ],
        ),
      ),
      body: Column(
        children: [
          // Category chips
          Container(
            height: r.spacing(mobile: 50),
            color: Colors.white,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: EdgeInsets.symmetric(
                horizontal: r.spacing(mobile: 12),
                vertical: r.spacing(mobile: 8),
              ),
              itemCount: _categories.length,
              itemBuilder: (context, index) {
                final category = _categories[index];
                final isSelected = category == _selectedCategory;
                
                return Padding(
                  padding: EdgeInsets.only(right: r.spacing(mobile: 8)),
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedCategory = category),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: EdgeInsets.symmetric(
                        horizontal: r.spacing(mobile: 16),
                        vertical: r.spacing(mobile: 6),
                      ),
                      decoration: BoxDecoration(
                        color: isSelected ? primaryOrange : Colors.grey[100],
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isSelected ? primaryOrange : Colors.grey[300]!,
                        ),
                      ),
                      child: Text(
                        category,
                        style: TextStyle(
                          color: isSelected ? Colors.white : Colors.black87,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                          fontSize: r.fontSize(mobile: 13),
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          
          // Auction list
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildAuctionList(r, primaryOrange),
                _buildMyBidsList(r, primaryOrange),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/create-auction'),
        backgroundColor: primaryOrange,
        icon: const Icon(Icons.add, color: Colors.white),
        label: Text(
          'Nueva Subasta',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: r.fontSize(mobile: 14),
          ),
        ),
      ).animate().fadeIn(delay: 500.ms).slideY(begin: 1, end: 0),
    );
  }

  Widget _buildAuctionList(Responsive r, Color primaryOrange) {
    final filteredAuctions = _selectedCategory == 'Todos'
        ? _auctions
        : _auctions.where((a) => a['category'] == _selectedCategory).toList();

    if (filteredAuctions.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.gavel, size: 64, color: Colors.grey[400]),
            SizedBox(height: r.spacing(mobile: 16)),
            Text(
              'No hay subastas activas',
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: r.fontSize(mobile: 16),
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: EdgeInsets.all(r.spacing(mobile: 16)),
      itemCount: filteredAuctions.length,
      itemBuilder: (context, index) {
        final auction = filteredAuctions[index];
        return _buildAuctionCard(auction, r, primaryOrange, index);
      },
    );
  }

  Widget _buildAuctionCard(
    Map<String, dynamic> auction,
    Responsive r,
    Color primaryOrange,
    int index,
  ) {
    final timeRemaining = auction['timeRemaining'] as Duration;
    final isUrgent = auction['isUrgent'] as bool;
    
    return Container(
      margin: EdgeInsets.only(bottom: r.spacing(mobile: 16)),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(13),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => context.push('/auction/${auction['id']}'),
          child: Padding(
            padding: EdgeInsets.all(r.spacing(mobile: 16)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  children: [
                    // Category icon
                    Container(
                      width: r.iconSize(mobile: 44),
                      height: r.iconSize(mobile: 44),
                      decoration: BoxDecoration(
                        color: primaryOrange.withAlpha(25),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(
                        _getCategoryIcon(auction['category']),
                        color: primaryOrange,
                        size: r.iconSize(mobile: 24),
                      ),
                    ),
                    SizedBox(width: r.spacing(mobile: 12)),
                    
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  auction['title'],
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: r.fontSize(mobile: 15),
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              if (isUrgent)
                                Container(
                                  padding: EdgeInsets.symmetric(
                                    horizontal: r.spacing(mobile: 8),
                                    vertical: r.spacing(mobile: 2),
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.red.withAlpha(25),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        Icons.bolt,
                                        color: Colors.red,
                                        size: r.iconSize(mobile: 12),
                                      ),
                                      Text(
                                        'URGENTE',
                                        style: TextStyle(
                                          color: Colors.red,
                                          fontSize: r.fontSize(mobile: 10),
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                            ],
                          ),
                          SizedBox(height: r.spacing(mobile: 4)),
                          Row(
                            children: [
                              Icon(
                                Icons.location_on_outlined,
                                size: r.iconSize(mobile: 14),
                                color: Colors.grey,
                              ),
                              SizedBox(width: r.spacing(mobile: 4)),
                              Text(
                                auction['location'],
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
                
                SizedBox(height: r.spacing(mobile: 16)),
                
                // Price comparison
                Container(
                  padding: EdgeInsets.all(r.spacing(mobile: 12)),
                  decoration: BoxDecoration(
                    color: Colors.grey[50],
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Oferta inicial',
                              style: TextStyle(
                                color: Colors.grey[600],
                                fontSize: r.fontSize(mobile: 11),
                              ),
                            ),
                            Text(
                              '\$${_formatPrice(auction['initialOffer'])}',
                              style: TextStyle(
                                color: Colors.grey[500],
                                fontSize: r.fontSize(mobile: 14),
                                decoration: TextDecoration.lineThrough,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Icon(
                        Icons.arrow_forward,
                        color: Colors.grey[400],
                        size: r.iconSize(mobile: 20),
                      ),
                      SizedBox(width: r.spacing(mobile: 12)),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              'Mejor puja',
                              style: TextStyle(
                                color: Colors.grey[600],
                                fontSize: r.fontSize(mobile: 11),
                              ),
                            ),
                            Text(
                              '\$${_formatPrice(auction['currentBestBid'])}',
                              style: TextStyle(
                                color: primaryOrange,
                                fontSize: r.fontSize(mobile: 16),
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                
                SizedBox(height: r.spacing(mobile: 12)),
                
                // Footer
                Row(
                  children: [
                    // Time remaining
                    _buildInfoChip(
                      Icons.timer_outlined,
                      _formatDuration(timeRemaining),
                      timeRemaining.inHours < 2 ? Colors.red : Colors.grey[700]!,
                      r,
                    ),
                    SizedBox(width: r.spacing(mobile: 12)),
                    
                    // Bid count
                    _buildInfoChip(
                      Icons.people_outline,
                      '${auction['bidCount']} pujas',
                      Colors.grey[700]!,
                      r,
                    ),
                    
                    const Spacer(),
                    
                    // Bid button
                    ElevatedButton(
                      onPressed: () => _showBidDialog(auction),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: primaryOrange,
                        foregroundColor: Colors.white,
                        padding: EdgeInsets.symmetric(
                          horizontal: r.spacing(mobile: 20),
                          vertical: r.spacing(mobile: 10),
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: Text(
                        'Pujar',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: r.fontSize(mobile: 13),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    ).animate()
      .fadeIn(delay: Duration(milliseconds: index * 100))
      .slideX(begin: 0.1, end: 0);
  }

  Widget _buildInfoChip(IconData icon, String label, Color color, Responsive r) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: r.iconSize(mobile: 16), color: color),
        SizedBox(width: r.spacing(mobile: 4)),
        Text(
          label,
          style: TextStyle(
            color: color,
            fontSize: r.fontSize(mobile: 12),
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildMyBidsList(Responsive r, Color primaryOrange) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.gavel_outlined, size: 64, color: Colors.grey[400]),
          SizedBox(height: r.spacing(mobile: 16)),
          Text(
            'No has hecho ninguna puja',
            style: TextStyle(
              color: Colors.grey[600],
              fontSize: r.fontSize(mobile: 16),
            ),
          ),
          SizedBox(height: r.spacing(mobile: 8)),
          Text(
            'Explora las subastas activas y haz tu primera puja',
            style: TextStyle(
              color: Colors.grey[500],
              fontSize: r.fontSize(mobile: 14),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  IconData _getCategoryIcon(String category) {
    switch (category) {
      case 'Plomería':
        return Icons.plumbing;
      case 'Electricidad':
        return Icons.electrical_services;
      case 'Carpintería':
        return Icons.carpenter;
      case 'Pintura':
        return Icons.format_paint;
      case 'Limpieza':
        return Icons.cleaning_services;
      case 'Jardinería':
        return Icons.yard;
      default:
        return Icons.build;
    }
  }

  String _formatPrice(int price) {
    return price.toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]},',
    );
  }

  String _formatDuration(Duration duration) {
    if (duration.inHours > 0) {
      return '${duration.inHours}h ${duration.inMinutes % 60}m';
    }
    return '${duration.inMinutes}m';
  }

  void _showFilters() {
    // TODO: Implementar filtros
  }

  void _showSearch() {
    // TODO: Implementar búsqueda
  }

  void _showBidDialog(Map<String, dynamic> auction) {
    final r = context.responsive;
    const primaryOrange = Color(0xFFFF6B36);
    final controller = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Padding(
          padding: EdgeInsets.all(r.spacing(mobile: 20)),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              SizedBox(height: r.spacing(mobile: 20)),
              
              Text(
                'Hacer una puja',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: r.fontSize(mobile: 20),
                ),
              ),
              SizedBox(height: r.spacing(mobile: 8)),
              
              Text(
                auction['title'],
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: r.fontSize(mobile: 14),
                ),
              ),
              SizedBox(height: r.spacing(mobile: 20)),
              
              Container(
                padding: EdgeInsets.all(r.spacing(mobile: 12)),
                decoration: BoxDecoration(
                  color: Colors.grey[50],
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Mejor puja actual:',
                      style: TextStyle(
                        fontSize: r.fontSize(mobile: 14),
                      ),
                    ),
                    Text(
                      '\$${_formatPrice(auction['currentBestBid'])}',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: r.fontSize(mobile: 16),
                        color: primaryOrange,
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(height: r.spacing(mobile: 16)),
              
              TextField(
                controller: controller,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: 'Tu oferta',
                  prefixText: '\$ ',
                  hintText: 'Ingresa un monto menor',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: primaryOrange, width: 2),
                  ),
                ),
              ),
              SizedBox(height: r.spacing(mobile: 8)),
              
              Text(
                '💡 En subastas inversas, gana la oferta más baja',
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: r.fontSize(mobile: 12),
                ),
              ),
              SizedBox(height: r.spacing(mobile: 20)),
              
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('¡Puja enviada exitosamente!'),
                        backgroundColor: Colors.green,
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryOrange,
                    foregroundColor: Colors.white,
                    padding: EdgeInsets.symmetric(vertical: r.spacing(mobile: 14)),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: Text(
                    'Enviar Puja',
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
    );
  }
}


