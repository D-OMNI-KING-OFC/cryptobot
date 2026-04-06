# Changelog
Source: https://docs.coingecko.com/changelog

Product updates and announcements

<Update label="March 2026">
  ## Stay Ahead with the New Crypto News Endpoint

  🗓️ **March 27, 2026**

  Get real-time crypto news and in-depth guides delivered straight from CoinGecko with the new [/news](/reference/news) endpoint!

  * Query all the latest crypto news, as seen on [CoinGecko News](https://www.coingecko.com/en/news)
  * Filter news by a specific coin using `coin_id`
  * Filter by `language` and `type` (news, guides, or both)
  * Supports pagination with `page` and `per_page` parameters

  ```json Example Payload expandable theme={null}
  [
    {
      "title": "Bitcoin stalls: Why BTC risks $65K fall despite $23M whale buy",
      "url": "https://ambcrypto.com/bitcoin-stalls-why-btc-risks-65k-fall-despite-23m-whale-buy/",
      "image": "https://assets.coingecko.com/articles/images/106731445/large/open-uri20260327-7-fuq6r9.?1774609423",
      "author": "Gladys Makena",
      "posted_at": "2026-03-27T11:00:42Z",
      "type": "news",
      "source_name": "AMBCrypto",
      "related_coin_ids": [
        "1-token-2",
        "1-token",
        "bitcoin"
      ]
    }
  ]
  ```

  > 💼 Exclusive for Paid Plan Subscribers (Analyst, Lite, Pro and Enterprise).

  <GreenSeparator />

  ## CGSimplePrice WebSocket Now Supports `vs_currencies`

  🗓️ **March 25, 2026**

  The [CGSimplePrice](/websocket/cgsimpleprice) WebSocket channel now supports specifying preferred exchange rates via `vs_currencies`!

  * Specify one or more target currencies using `vs_currencies` in the subscription data (e.g. `["usd","eur"]`)
  * Choose from any currency supported by [`/simple/supported_vs_currencies`](/reference/simple-supported-currencies)
  * If `vs_currencies` is not specified, data is returned in USD by default
  * A new `vs` field is included in every response payload indicating the target currency

  **Input Example:**

  ```json theme={null}
  {
    "command": "message",
    "identifier": "{\"channel\":\"CGSimplePrice\"}",
    "data": "{\"coin_id\":[\"ethereum\",\"bitcoin\"],\"vs_currencies\":[\"usd\",\"eur\"],\"action\":\"set_tokens\"}"
  }
  ```

  **Response now includes `vs` field:**

  ```json {4} theme={null}
  {
    "c": "C1",
    "i": "ethereum",
    "vs": "usd",
    "m": 312938652962.8005,
    "p": 2591.080889351465,
    "pp": 1.3763793110454519,
    "t": 1747808150.269067,
    "v": 20460612214.801384
  }
  ```

  <GreenSeparator />

  ## `interval=hourly` Now Available for All Plans on Coin Market Chart Endpoints

  🗓️ **March 24, 2026**

  The `interval=hourly` parameter is now accessible to all API users (Demo, Basic, Analyst & above) for the coin market chart endpoints:

  * [/coins/\{id}/market\_chart](/reference/coins-id-market-chart) — hourly data up to the **past 100 days**
  * [/coins/\{id}/market\_chart/range](/reference/coins-id-market-chart-range) — hourly data up to **any 100 days** date range per request

  Previously restricted to Enterprise plan subscribers, you can now bypass auto-granularity by specifying `interval=hourly` on any plan. The `interval=5m` parameter remains exclusive to Enterprise subscribers.

  <GreenSeparator />

  ## GT Verified Badge & Outstanding Token Value for Coin Endpoints

  🗓️ **March 23, 2026**

  ### New `gt_verified` Field for Onchain Token & Pool Info

  A new `gt_verified` boolean field is now available in the response payload for:

  * [/onchain/networks/\{network}/tokens/\{address}/info](/reference/token-info-contract-address)
  * [/onchain/networks/\{network}/pools/\{pool\_address}/info](/reference/pool-token-info-contract-address)

  Learn more about [GT Verified](https://support.coingecko.com/hc/en-us/articles/54413671274649-What-is-GT-Verified-Badge).

  ```json Example Payload {4} theme={null}
  {
    ...
    "gt_score": 92.6605504587156,
    "gt_verified": true,
    "discord_url": null,
    ...
  }
  ```

  ### New `outstanding_token_value_usd` & `outstanding_supply` Fields

  Two new fields are now included in `market_data` for the following endpoints:

  * [/coins/\{id}](/reference/coins-id)
  * [/coins/\{id}/contract/\{contract\_address}](/reference/coins-contract-address)

  **New fields:**

  * `market_data.outstanding_token_value_usd` — Outstanding token value in USD (nullable)
  * `market_data.outstanding_supply` — The amount of tokens outstanding in the market, including tokens that are circulated/tradable or planned for circulation. Excludes token supplies not planned for circulation or usage. Used to better understand the current theoretical maximum valuation of a token. (nullable)

  ```json Example Payload {3, 7} expandable theme={null}
  "market_data": {
    "market_cap_rank": 1,
    "outstanding_token_value_usd": null,
    ...
    "circulating_supply": 19675962,
    "total_supply": 21000000,
    "outstanding_supply": 20003043.0,
    ...
  }
  ```
</Update>

<Update label="February 2026">
  ## Comprehensive Token Holder Analytics with PnL Details

  🗓️ **February 25, 2026**

  Track the financial performance of top token holders with detailed profit and loss metrics in the [Top Token Holders by Token Address](/reference/top-token-holders-token-address) endpoint!

  **New optional parameter:**

  * **`include_pnl_details`** (boolean, default: `false`):<br />Include comprehensive PnL metrics and trading analytics for each token holder

  **New conditional fields returned when `include_pnl_details=true`:**

  * `average_buy_price_usd` — Average purchase price per token in USD
  * `total_buy_count` — Total number of buy transactions
  * `total_sell_count` — Total number of sell transactions
  * `unrealized_pnl_usd` — Unrealized profit/loss in USD based on current token price
  * `unrealized_pnl_percentage` — Unrealized profit/loss as a percentage of total entry value
  * `realized_pnl_usd` — Realized profit/loss in USD from completed sell transactions
  * `realized_pnl_percentage` — Realized profit/loss as a percentage of total sell value
  * `explorer_url` — Direct link to the holder's address on the blockchain explorer

  ```json Example Payload {15-22} expandable theme={null}
  {
    "data": {
      "id": "base_0x6921b130d297cc43754afba22e5eac0fbf8db75b",
      "type": "top_holder",
      "attributes": {
        "last_updated_at": "2026-02-16T09:56:34.328Z",
        "holders": [
          {
            "rank": 1,
            "address": "0x56bbe4200fdd412854bcf05f2c992827b64ee5c1",
            "label": null,
            "amount": "9703812154.0",
            "percentage": "14.3507",
            "value": "966572.07",
            "average_buy_price_usd": null,
            "total_buy_count": null,
            "total_sell_count": null,
            "unrealized_pnl_usd": null,
            "unrealized_pnl_percentage": null,
            "realized_pnl_usd": null,
            "realized_pnl_percentage": null,
            "explorer_url": "https://basescan.org/address/0x56bbe4200fdd412854bcf05f2c992827b64ee5c1"
          },
  ```

  <GreenSeparator />

  ## Enhanced Pool Discovery and Treasury Analytics with New Sorting and Holdings Metrics

  🗓️ **February 12, 2026**

  Discover pools and analyze institutional crypto holdings with powerful new sorting options and comprehensive financial metrics!

  ### Introduced New Sort Options for Pool Megafilter

  Find the perfect pools for your trading strategy with four new sorting options in the [Megafilter for Pools](/reference/pools-megafilter) endpoint:

  * **`price_asc`** — Sort by token price (lowest to highest)
  * **`price_desc`** — Sort by token price (highest to lowest)
  * **`h24_tx_count_asc`** — Sort by 24-hour transaction count (lowest to highest)
  * **`h24_volume_usd_asc`** — Sort by 24-hour volume in USD (lowest to highest)

  Identify undervalued gems by sorting ascending on price, discover high-activity pools with transaction count sorting, or find emerging opportunities with low-volume pools that show potential.

  ### Enriched Treasury Holdings Data with Holdings Metrics and Historical Tracking

  Gain deeper insights into institutional crypto adoption with comprehensive financial data in the [Crypto Treasury Holdings by Entity ID](/reference/public-treasury-entity) endpoint:

  **New default fields returned for all requests:**

  * `total_treasury_value_usd` — Total current holdings value
  * `unrealized_pnl` — Profit/loss vs entry cost
  * `m_nav` — Market to net asset value ratio
  * `total_asset_value_per_share_usd` — Per-share asset value
  * Per-holding metrics:
    * `amount_per_share`, `entity_value_usd_percentage`, `current_value_usd`, `total_entry_value_usd`, `average_entry_value_usd`, `unrealized_pnl`

  ```json Example Payload {9-12, 18-23} expandable theme={null}
  {
    "name": "Strategy",
    "id": "strategy",
    "type": "company",
    "symbol": "MSTR.US",
    "country": "US",
    "website_url": "https://www.strategy.com/",
    "twitter_screen_name": "Strategy",
    "total_treasury_value_usd": 48119580010.663155,
    "unrealized_pnl": -6554973853.336845,
    "m_nav": 0.99,
    "total_asset_value_per_share_usd": 150.46302495438903,
    "holdings": [
      {
        "coin_id": "bitcoin",
        "amount": 714644.0,
        "percentage_of_total_supply": 3.403,
        "amount_per_share": 0.0022345892873893874,
        "entity_value_usd_percentage": 100.0,
        "current_value_usd": 48119580010.663155,
        "total_entry_value_usd": 54674553864.0,
        "average_entry_value_usd": 76506.0,
        "unrealized_pnl": -6554973853.336845
      }
    ]
  }
  ```

  **New optional parameters for historical analysis:**

  * **`holding_amount_change`** — Track absolute holding changes over time
  * **`holding_change_percentage`** — Track percentage changes in holdings
  * **Supported timeframes:** `7d`, `14d`, `30d`, `90d`, `1y`, `ytd` (comma-separated for multiple)

  ```json Example Payload {14-29} expandable theme={null}
    ...
    "total_asset_value_per_share_usd": 150.46302495438903,
    "holdings": [
      {
        "coin_id": "bitcoin",
        "amount": 714644.0,
        "percentage_of_total_supply": 3.403,
        "amount_per_share": 0.0022345892873893874,
        "entity_value_usd_percentage": 100.0,
        "current_value_usd": 48119580010.663155,
        "total_entry_value_usd": 54674553864.0,
        "average_entry_value_usd": 76506.0,
        "unrealized_pnl": -6554973853.336845,
        "holding_amount_change": {
          "7d": 1142.0,
          "14d": 1997.0,
          "30d": 27234.0,
          "90d": 72952.0,
          "1y": 235904.0,
          "ytd": 42144.0
        },
        "holding_change_percentage": {
          "7d": 0.16,
          "14d": 0.28,
          "30d": 3.962,
          "90d": 11.369,
          "1y": 49.276,
          "ytd": 6.267
        }
      }
    ]
  }
  ```
</Update>

<Update label="January 2026">
  ## \[Upcoming Change] Starknet Address Format Update

  🗓️ **January 30, 2026**

  **Effective Date**: 10 February 2026, 02:00 UTC

  To ensure consistent data matching, we are updating the Starknet address format across the CoinGecko API.

  **Summary of Changes**: Starting 10 February at 02:00 UTC, Starknet addresses (tokens and pools) will be standardized to the Padded Format (66 characters).

  **Scope of Change:** This update **only** affects:

  * **Onchain API endpoints** (e.g., `/onchain/networks/starknet-alpha/pools..`)
  * **Onchain WebSocket channels** (broadcasted messages)

  | Feature          | Change Description                                               |
  | ---------------- | ---------------------------------------------------------------- |
  | API Responses    | All address fields will return in **padded format** (`0x0...`).  |
  | API Requests     | We will continue to accept **both** padded and unpadded formats. |
  | WebSockets       | All broadcasted messages will use the **padded format**.         |
  | WS Subscriptions | Both padded and unpadded formats will be accepted for sub/unsub. |

  ### Technical Details: Padded vs. Unpadded

  The primary difference is the addition of a leading zero following the `0x` prefix to reach a consistent 66-character length.

  * **Old Format (Unpadded):** `0x4718...` (65 characters)
  * **New Format (Padded):** `0x04718...` (66 characters)

  ### What this means for you

  * **No Breaking Request Changes:** Your existing API calls using unpadded addresses will continue to work; our system will normalize these inputs automatically.
  * **String Matching:** If your application performs strict string comparisons (e.g., `if (api_address === local_db_address)`), you should update your logic to handle padded formats or normalize addresses to a consistent length before comparing.
  * **Data Storage:** If you store Starknet addresses from our API, be aware that future records will include the padding.

  > **Note:** This change is specific to the **Starknet** network. Address formats for other chains (Ethereum, BSC, Solana, etc.) remain unaffected.

  <GreenSeparator />

  ## Streamlined Notification Management with Multi-Recipient Email Alerts

  🗓️ **January 27, 2026**

  Ensure critical billing and usage alerts reach the right teams with our new email recipient management system!

  Introducing the ability to add multiple email recipients for your API notifications directly from your dashboard. Account owners can now configure billing alerts and usage threshold notifications to reach multiple stakeholders without manual forwarding.

  Add recipients who don't need CoinGecko accounts, customize notification preferences per recipient, and manage your distribution list anytime — all from the new Notifications ([developers/dashboard#notifications](https://www.coingecko.com/en/developers/dashboard#notifications)) tab.

  **Available on:** Analyst plans and above, with expanded recipient limits for Enterprise plans. [Learn more about our API offerings](https://www.coingecko.com/en/api/pricing).

  Perfect for larger teams where finance, operations, and engineering need independent access to critical alerts, eliminating single points of failure and enabling faster incident response when usage spikes or payments require attention.

  **Learn more:** [How to Manage API Email Recipients](https://support.coingecko.com/hc/en-us/articles/54516497903129-How-to-Manage-API-Email-Recipients)

  <GreenSeparator />

  ## Enhanced Team Collaboration with Role-Based Dashboard Access

  🗓️ **January 26, 2026**

  Securely share your API dashboard with team members using our new role-based access control system!

  Introducing Team Invites & Shared Access — invite team members to collaborate on your API subscription without sharing login credentials (see [developers/dashboard#access](https://www.coingecko.com/en/developers/dashboard#access) tab). Account owners can now add "Collaborator" users who can:

  * Manage API keys
  * Monitor credit usage across API and WebSocket channels
  * Access billing details from the Stripe portal.

  The new dashboard switcher lets users seamlessly toggle between multiple team views when they're members of different organizations.

  **Available on:** All plans, with increased seat limits for higher-tier subscriptions. [Learn more about our API offerings](https://www.coingecko.com/en/api/pricing).

  Designed for larger teams, this feature enables secure credential management, faster incident response (any collaborator can rotate compromised keys immediately), and independent access for finance teams to retrieve invoices — eliminating operational bottlenecks and security risks from shared login credentials.

  **Learn more:**

  * [How to Manage Team Access on Your API Dashboard](https://support.coingecko.com/hc/en-us/articles/54503844273945-How-to-Manage-Team-Access-on-Your-API-Dashboard)
  * [Team Access for API Plans FAQ](https://support.coingecko.com/hc/en-us/articles/54503941840025-Team-Access-for-API-Plans-FAQ)

  <GreenSeparator />

  ## Advanced Filtering with Pagination for Treasury Data and Price Change Filters for Megafilter

  🗓️ **January 22, 2026**

  Empower your data analysis with enhanced filtering and pagination capabilities across key endpoints!

  ### Introduced Pagination and Sorting to Public Treasury Endpoint

  Take control of large treasury datasets with new pagination and sorting parameters in the [Crypto Treasury Holdings by Coin ID](/reference/companies-public-treasury) endpoint:

  * **`per_page`**: Control results per page (1-250, default: 250)
  * **`page`**: Navigate through paginated results (default: 1)
  * **`order`**: Sort by total holdings in USD
    * `total_holdings_usd_desc` (default) — Highest holdings first
    * `total_holdings_usd_asc` — Lowest holdings first

  Efficiently analyze public companies and governments holding cryptocurrencies by breaking down large datasets into manageable pages and sorting by holdings to identify major institutional players or discover emerging adopters.

  ### Introduced Price Change Filters to Pool Megafilter

  Discover trending pools with precision using new price change percentage filters in the [Megafilter for Pools](/reference/pools-megafilter) endpoint:

  * **`price_change_percentage_min`**: Minimum price change percentage threshold
  * **`price_change_percentage_max`**: Maximum price change percentage threshold
  * **`price_change_percentage_duration`**: Time window for price change
    * Available durations: `5m`, `1h`, `6h`, `24h`

  Filter pools by price performance over your preferred timeframe to identify explosive short-term movers (5-minute surges), hourly momentum plays, or sustained 24-hour trends — perfect for building custom screeners and automated trading strategies.

  <GreenSeparator />

  ## Enhanced Market Analytics with Volume Change Tracking and Historical OHLC for Inactive Coins

  🗓️ **January 21, 2026**

  Gain deeper market insights with new volume metrics and expanded historical data access!

  ### Introduced Volume Change Percentage to Global Market Data

  Track global market momentum with the new `volume_change_percentage_24h_usd` field in the [Crypto Global Market Data](/reference/crypto-global) endpoint:

  ```json JSON {3} theme={null}
  {
    "market_cap_change_percentage_24h_usd": 0.7227196786856437,
    "volume_change_percentage_24h_usd": -0.2692391926571914,
    "updated_at": 1769062741
  }
  ```

  Monitor how global trading volume shifts over 24 hours to identify market sentiment changes, spot emerging trends, and make more informed trading decisions alongside market cap changes.

  ### Expanded Historical OHLC Data Access for Inactive Coins

  Access historical candlestick data for inactive and delisted coins to complete your historical analysis:

  * [Coin OHLC by ID](/reference/coins-id-ohlc) — `/coins/{id}/ohlc`
  * [Coin OHLC Range by ID](/reference/coins-id-ohlc-range) — `/coins/{id}/ohlc/range`

  Retrieve complete historical OHLC (Open, High, Low, Close) data even for coins that are no longer actively traded, enabling comprehensive backtesting, historical research, and portfolio performance analysis across your entire trading history.

  <GreenSeparator />

  ## Expanded WebSocket Streaming with New Intervals and Quote Token Data

  🗓️ **January 20, 2026**

  We've supercharged our WebSocket API with powerful new capabilities to help you build more sophisticated trading and analytics applications!

  ### Introduced 15-Minute, 12-Hour, and Daily Intervals for OnchainOHLCV

  Unlock more flexible timeframe analysis with three new interval options for the [OnchainOHLCV](/websocket/wssonchainohlcv) WebSocket channel:

  * **New intervals added:** `15m`, `12h`, `1d`
  * **Complete interval options:** `1s`, `1m`, `5m`, `15m`, `1h`, `2h`, `4h`, `8h`, `12h`, `1d`

  Stream candlestick data at granular 15-minute intervals for short-term trading strategies, or capture broader market trends with 12-hour and daily candles perfectly suited for swing tradin
