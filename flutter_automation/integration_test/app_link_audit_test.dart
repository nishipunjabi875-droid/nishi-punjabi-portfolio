import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:http/http.dart' as http;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Flutter App 404 Link Audit Integration Test Suite', () {
    final client = http.Client();

    tearDownAll(() {
      client.close();
    });

    testWidgets('Verify all in-app navigation & web links do not return 404',
        (WidgetTester tester) async {
      print('=== STARTING FLUTTER WIDGET INTEGRATION 404 TEST ===');

      // 1. Build sample target UI widget tree (or launch main App widget)
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            appBar: AppBar(title: const Text('Flutter App Link Test')),
            body: ListView(
              children: [
                ListTile(
                  title: const Text('Media Center'),
                  subtitle: const Text('https://www.woodenstreet.com/media'),
                ),
                ListTile(
                  title: const Text('Platters Category'),
                  subtitle: const Text('https://www.woodenstreet.com/platters'),
                ),
                ListTile(
                  title: const Text('Sofa Sets Category'),
                  subtitle: const Text('https://www.woodenstreet.com/sofa-sets'),
                ),
                ListTile(
                  title: const Text('Wall Masks'),
                  subtitle: const Text('https://www.woodenstreet.com/wall-masks'),
                ),
              ],
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // 2. Find all ListTile widgets containing link text
      final listTiles = find.byType(ListTile);
      expect(listTiles, findsWidgets);

      final broken404s = <String>[];
      final auditedUrls = <String>[];

      // 3. Extract subtitles (URLs) and verify HTTP status
      for (var tile in listTiles.evaluate()) {
        final widget = tile.widget as ListTile;
        if (widget.subtitle is Text) {
          final urlText = (widget.subtitle as Text).data;
          if (urlText != null && urlText.startsWith('http')) {
            auditedUrls.add(urlText);

            try {
              final response = await client
                  .get(Uri.parse(urlText))
                  .timeout(const Duration(seconds: 8));

              if (response.statusCode == 404) {
                broken404s.add('$urlText (Text: ${(widget.title as Text).data})');
                print('❌ [404 DETECTED IN FLUTTER APP] $urlText');
              } else {
                print('✅ [${response.statusCode}] $urlText');
              }
            } catch (e) {
              print('⚠️ Error testing $urlText: $e');
            }
          }
        }
      }

      print('\n==================================================');
      print('FLUTTER INTEGRATION AUDIT RESULTS');
      print('Total UI Links Tested: ${auditedUrls.length}');
      print('404 Broken Links: ${broken404s.length}');
      print('==================================================\n');

      // 4. Assertion: Fail integration test if any 404 links exist
      expect(
        broken404s,
        isEmpty,
        reason: 'Found 404 broken links in Flutter App UI: ${broken404s.join(", ")}',
      );
    });
  });
}
