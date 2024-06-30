#!/usr/bin/env bash

TEST_FILE=testing/fixtures.html

tree-sitter generate && \
nvim $TEST_FILE -c "set ft=htmlaskama | TSUpdate" && nvim $TEST_FILE -c "set ft=htmlaskama | InspectTree"
