#include <iostream>
#include <vector>

using namespace std;

void solve() {
    long long n, k, m;
    cin >> n >> k >> m;

    if (k > m) {
        cout << "NO\n";
        return;
    }

    cout << "YES\n";
    for (int i = 1; i <= n; i++) {
        if (i == k) {
            cout << (m - k + 1) << (i == n ? "" : " ");
        } else {
            cout << 1 << (i == n ? "" : " ");
        }
    }
    cout << "\n";
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int t;
    cin >> t;
    while (t--) {
        solve();
    }
    return 0;
}