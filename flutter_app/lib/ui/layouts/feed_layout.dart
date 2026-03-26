import 'package:flutter/material.dart';

class FeedLayout extends StatelessWidget {
  final List<Widget> children;
  final ScrollController? scrollController;

  const FeedLayout({
    super.key,
    required this.children,
    this.scrollController,
  });

  @override
  Widget build(BuildContext context) {
    // Layouts handle structural composition, not specific business logic if avoidable
    return ListView.builder(
      controller: scrollController,
      itemCount: children.length,
      itemBuilder: (context, index) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 16.0), // Consistent spacing
          child: children[index],
        );
      },
    );
  }
}
