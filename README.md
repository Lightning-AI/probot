# lightning-probot

A GitHub App built with [Probot](https://github.com/probot/probot) that implements bot actions for PyTorch Lightning.

Forked from https://github.com/pytorch/probot.

## auto-cc-bot

Add an issue to your project like https://github.com/pytorch/pytorch/issues/24422
and add a `.github/lightning-probot.yml` file with:

```yml
# https://github.com/Lightning-AI/lightning/issues/10530
tracking_issue: 10530
```

Based on who is listed in the tracking issue, the bot will automatically
CC people when labels are added to an issue.

## check-group

Adaptation of https://github.com/tianhaoz95/check-group/blob/master/README.md that works as a GitHub action, is only triggered with the `pull_request` event type, and checks the job statuses with an interval.

## Setup

```sh
make build
```

## Deploying GitHub Actions

Follow the instructions at
https://github.com/actions/toolkit/blob/master/docs/action-versioning.md

## Contributing

If you feel like an improvement could be made, please open an issue in the PyTorch Lightning repository instead.

https://github.com/PyTorchLightning/pytorch-lightning

## License

(cc-bot) ISC © 2019 Edward Z. Yang <ezyang@fb.com> (https://pytorch.org)
(check-group) ISC © 2020 Tianhao Zhou tianhaoz@umich.edu
ISC © 2022 Carlos Mocholí <carlos@lightning.ai> (https://lightning.ai)
