import {each, debounce} from 'lodash';
import BigNumber from "bignumber.js";
import {Coin, Wallet} from '@berrywallet/core';

import {Coins, createDebugger, Actions} from "Core";
import {WalletController} from "Background/Controllers";
import {sendNotification, TransactionNotification} from 'Core/Extension/NotificationManager';

const updateBlockTimeout = 20 * 60 * 1000;

export class WalletManager {
    protected wdProvider: Wallet.Provider.WDProvider;

    protected debug;
    protected coin: Coins.CoinInterface;
    protected controller: WalletController;
    protected updaterTimeoutIndex;

    protected lastConnectionCheck: Date;

    /**
     * @param {CoinInterface} coin
     * @param {WDProvider} wdProvider
     * @param {WalletController} walletController
     */
    public constructor(wdProvider: Wallet.Provider.WDProvider,
                       coin: Coins.CoinInterface,
                       walletController: WalletController) {

        this.coin = coin;
        this.wdProvider = wdProvider;
        this.controller = walletController;

        this.debug = createDebugger('WM:' + this.coin.getUnit());

        this.mapEventsToWDProvider();

        wdProvider.getNetworkProvider().onNewBlock(this.updateBlockInfo);
        wdProvider.getNetworkProvider().getTracker().onConnect(() => {
            if (this.lastConnectionCheck) {
                const currentTime = new Date().getTime();
                if (currentTime - this.lastConnectionCheck.getTime() > updateBlockTimeout) {
                    this.updateWalletData();
                }
            }

            this.lastConnectionCheck = new Date();
        });

        wdProvider.on('tx:new', (tx: Wallet.Entity.WalletTransaction) => {
            const balance = this.wdProvider.balance;
            const amount = Wallet.Helper.calculateTxBalance(balance, tx.txid);

            if (amount > 0) {
                sendNotification(new TransactionNotification(this.coin, tx, amount))
                    .then((notificationId: string) => {
                        this.debug('Showed Notification with ID:' + notificationId);
                    });
            }
        });

        this.setUpdateTimeout();
    }

    public getWDProvider(): Wallet.Provider.WDProvider {
        return this.wdProvider;
    }

    public updateBlockInfo = (block: Wallet.Entity.Block) => {
        this.controller.dispatchStore(Actions.Reducer.CoinAction.SetBlockHeight, {
            coinKey: this.coin.getKey(),
            blockHeight: block.height
        });
    };

    protected putNewTx(tx: Wallet.Entity.WalletTransaction): void {
        this.wdProvider.tx.add(tx);
    }

    protected mapEventsToWDProvider() {
        const walletDataSaver = debounce(() => {
            const actionPayload = {
                walletCoinKey: this.coin.getKey(),
                walletData: this.wdProvider.getData()
            };

            this.controller.dispatchStore(Actions.Reducer.WalletAction.SetWalletData, actionPayload);
            this.setUnconfirmedTxTracking();
        }, 300);

        this.wdProvider.onChange(walletDataSaver);

        const trackAddress: string[] = this.wdProvider.address.list().map(addr => addr.address);
        const networkProvider = this.wdProvider.getNetworkProvider();
        networkProvider.onAddrsTx(trackAddress, (tx) => this.putNewTx(tx));

        this.setUnconfirmedTxTracking();
    }

    /**
     * @param {string} address
     * @param {number} value
     * @param {FeeTypes} fee
     *
     * @returns {Promise<WalletTransaction | void>}
     */
    public sendTransaction = (address: string,
                              value: BigNumber,
                              fee: Coin.FeeTypes = Coin.FeeTypes.Medium): Promise<Wallet.Entity.WalletTransaction | void> => {

        const bufferSeed = this.controller.getSeed();

        const privateWallet = this.wdProvider.getPrivate(bufferSeed);
        const parsedAddress = Coin.Helper.parseAddressByCoin(this.wdProvider.getData().coin, address);

        const onBroadcastingError = (error) => {
            this.debug('Error on send transaction', error);

            throw new Error('Error on send transaction');
        };

        const onCreatingError = (error) => {
            this.debug('Error on create transaction', error);

            throw new Error('Error on create transaction');
        };

        const broadcastTransaction = (transaction: Coin.Transaction.Transaction) => {
            const onSuccessBroadcastTx = (txid: string) => {
                const walletTx = Wallet.Helper.coinTxToWalletTx(txid, transaction, this.coin.getCoreCoin());
                this.putNewTx(walletTx);

                return walletTx;
            };

            return privateWallet
                .broadcastTransaction(transaction)
                .then(onSuccessBroadcastTx, onBroadcastingError)
                .catch(onBroadcastingError);
        };

        return privateWallet
            .createTransaction(parsedAddress, value, fee)
            .then(broadcastTransaction, onCreatingError)
            .catch(onCreatingError);
    };

    /**
     * @param {string} address
     * @param {number} value
     * @param {FeeTypes} fee
     * @returns {Promise<BigNumber>}
     */
    public calculateFee = (address: string, value: number, fee: Coin.FeeTypes = Coin.FeeTypes.Medium) => {
        const bufferSeed = this.controller.getSeed();

        const privateWallet = this.wdProvider.getPrivate(bufferSeed);
        let parsedAddress = null;

        if (address) {
            try {
                parsedAddress = Coin.Helper.parseAddressByCoin(this.wdProvider.getData().coin, address);
            } catch (error) {
                this.debug('Parsing address error', error);
            }
        }

        return privateWallet.calculateFee(new BigNumber(value), parsedAddress, fee);
    };

    public destruct(): void {
        if (this.wdProvider) {
            this.wdProvider.destruct();
        }
    }

    protected setUnconfirmedTxTracking(): void {
        const tracker = this.wdProvider.getNetworkProvider().getTracker();

        tracker.removeAllListeners('tx.*');

        each(this.wdProvider.tx.unconfirmedList(), (utx) => {
            tracker.onTransactionConfirm(utx.txid, (tx) => this.putNewTx(tx));
        });
    }

    protected updateWalletData = (): void => {
        try {
            this.wdProvider.getUpdater().update();
        } catch (error) {
            this.debug('Updating WD error', error);
        }
    };

    protected setUpdateTimeout = (): void => {
        if (this.updaterTimeoutIndex) {
            clearTimeout(this.updaterTimeoutIndex);
        }

        this.updaterTimeoutIndex = setInterval(this.updateWalletData, 15 * 60 * 1000);
    };

    public getPrivateKey(walletAddress: Wallet.Entity.WalletAddress): string {
        const bufferSeed = this.controller.getSeed();
        const privateWallet = this.wdProvider.getPrivate(bufferSeed);
        const addressNode = privateWallet.deriveAddressNode(walletAddress);

        return addressNode.getPrivateKey().toString();
    }
}
