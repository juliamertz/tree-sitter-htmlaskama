#!/usr/bin/env bash

vim_path=$HOME/.config/nvim

rm $vim_path/queries/askama/*.scm

cd queries
for file in *.scm; do
  ln -s $(pwd)/$file $vim_path/queries/htmlaskama/$file
done
cd ..
